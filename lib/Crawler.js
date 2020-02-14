const SitemapGenerator = require('advanced-sitemap-generator');
const Handler = require('./DataHandler');
const Elastic = require('./ElasticClient');
const config = require('./config');
const Helper = require('./Helper');

function createSitemapGenerator(filename, url){
    const generator = SitemapGenerator(url, {
       stripQuerystring: true,
       ignoreHreflang: true,
       filepath: filename,
       excludeURLs: ['/doc/adres', '/doc/organisatie', '/id/adres', '/id/organisatie']
    });

    return generator;
}

function start(filename, url){
    const generator = createSitemapGenerator(filename, url);

    generator.on('done', async () => {
        await Helper.deleteIdentifierURLs(config.ORIGINAL_SITEMAP);

        const [indexed_urls, indexed_fis] = await Handler.convertDataFromSitemap();

        // Create Elasticsearch client and an index
        const client = Elastic.createElasticsearchClient(config.ELASTICSEARCH_HOST);
        Elastic.createElasticsearchIndex(client, config.URL_INDEX);
        Elastic.createElasticsearchIndex(client, config.FRAGMENT_IDENTIFIER_INDEX);


        // Add data in bulk mode to Elasticsearch
        Elastic.addDataInBulkMode(client, indexed_urls, config.URL_INDEX, config.URL_TYPE);
        Elastic.addDataInBulkMode(client, indexed_fis, config.FRAGMENT_IDENTIFIER_INDEX, config.FRAGMENT_IDENTIFIER_TYPE);
    });

    generator.start();
}

function update(filename, url){
    const generator = createSitemapGenerator(filename, url);

    generator.on('done', async () => {
        await Helper.deleteIdentifierURLs(config.UPDATE_SITEMAP);

        const newURLs = await Handler.compareToOriginalSiteMap();
        const newIndexedURLs = Helper.convertURLsToJSON(newURLs);
        const newIndexedFIs = await Handler.getFragmentIdentifiers(newURLs);

        const client = Elastic.createElasticsearchClient(config.ELASTICSEARCH_HOST);
        Elastic.addDataInBulkMode(client, newIndexedURLs, config.URL_INDEX, config.URL_TYPE);
        Elastic.addDataInBulkMode(client, newIndexedFIs, config.FRAGMENT_IDENTIFIER_INDEX, config.FRAGMENT_IDENTIFIER_TYPE);

    });

    generator.start();
}

module.exports = {start, update};



