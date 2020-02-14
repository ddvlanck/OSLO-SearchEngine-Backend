const Crawler = require('./lib/Crawler');
const config = require('./lib/config');
const Helper = require('./lib/Helper');
const Elastic = require('./lib/ElasticClient');
const Handler = require('./lib/DataHandler');
const cron = require("node-cron");
const fs = require('fs');

try {

    // We already have a first sitemap
    if(fs.existsSync('./' + config.ORIGINAL_SITEMAP)){
        addDataToElastic();
    } else {

        console.log("NO");
        //Crawler.start(config.ORIGINAL_SITEMAP, 'https://data.vlaanderen.be');
    }


    // Cron job is executed: “At 00:00 on day-of-month 1 in every month.”
    //cron.schedule("0 0 1 */1 *", function() {
    //    update();
    //});


} catch (e) {

}

// TODO: remove duplicate code

async function addDataToElastic(){
    await Helper.deleteIdentifierURLs(config.ORIGINAL_SITEMAP);
    const [indexed_urls, indexed_fis] = await Handler.convertDataFromSitemap();

    // Create Elasticsearch client and an index
    /*const client = Elastic.createElasticsearchClient(config.ELASTICSEARCH_HOST);
    Elastic.createElasticsearchIndex(client, config.URL_INDEX);
    Elastic.createElasticsearchIndex(client, config.FRAGMENT_IDENTIFIER_INDEX);


    // Add data in bulk mode to Elasticsearch
    Elastic.addDataInBulkMode(client, indexed_urls, config.URL_INDEX, config.URL_TYPE);
    Elastic.addDataInBulkMode(client, indexed_fis, config.FRAGMENT_IDENTIFIER_INDEX, config.FRAGMENT_IDENTIFIER_TYPE);*/
}
