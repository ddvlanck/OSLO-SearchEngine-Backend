const fs = require('fs');
const xml2js = require('xml2js');
const Parser = new xml2js.Parser({attrkey: "ATTR"});
const XMLWriter = require('xml-writer');

/*
* Converts URLs to JSON objects with metadata
* @params {urls}: list of objects containing the URLs (output from XML converter)
* */
function convertURLsToJSON(urls) {
    let indexedURLs = [];
    for (let index in urls) {

        // Create JSON objects for the sitemap.xml
        let object = {};
        object.url = urls[index].loc[0];
        object.keywords = createKeywords(object.url);
        object.priority = urls[index].priority[0];
        object.lastmod = urls[index].lastmod[0];
        object.type = urlType(object.url);
        indexedURLs.push(object);

    }
    return indexedURLs
}

/*
* Creates the keywords for the URL that will be pushed to Elasticsearch
* @param {url}: a URL
* */
function createKeywords(url) {
    // Remove the base domain and use other parts as keywords
    // Main website has no other parts, so we define them ourselves
    if (url === 'https://data.vlaanderen.be/') {
        return ['data', 'vlaanderen', 'be'];
    } else if (url === 'https://data.vlaanderen.be/ns') {
        let keywords = url.replace('https://data.vlaanderen.be/', '').split('/');
        keywords.push('vocabularium', 'applicatieprofiel');
    } else {
        return url.replace('https://data.vlaanderen.be/', '').split('/');
    }

}

/*
* Determines the type of the URL and will be added as metadata to the corresponding JSON object
* @param {url}: a URL
* */
function urlType(url) {
    let type = "Pagina of document";    // Each URL is a page or document

    // Check if we can add a more detailed type
    if (url.indexOf('/standaarden/') >= 0) {
        type = "Status in standaardenregister";
    } else if (url.indexOf('/applicatieprofiel/') >= 0) {
        type = "Applicatieprofiel"
    } else if (url.indexOf('/ns/') >= 0) {
        type = "Vocabularium"
    } else if (url.indexOf('/conceptscheme/') >= 0) {
        type = "Codelijst"
    } else if (url.indexOf('/concept/') >= 0) {
        type = "Waarde van een codelijst"
    }

    // Specific Web pages
    if (url === 'https://data.vlaanderen.be/') {
        type = "Hoofdpagina"
    } else if (url === 'https://data.vlaanderen.be/dumps') {
        type = "Data dumps";
    } else if (url === 'https://data.vlaanderen.be/ns') {
        type = "Namespace met alle vocabularia en applicatieprofielen";
    } else if (url === 'https://data.vlaanderen.be/standaarden') {
        type = "Standaardenregister";
    }

    return type;
}

/*
* Function that converts XML data to JSON data
* @params {sitemap}: name of the XML sitemap whose data is to be converted
* */
function XMLToJSON(sitemap) {
    return new Promise(resolve => {
        fs.readFile(sitemap, (err, xmlString) => {
            if (err) {
                console.error('Error reading the sitemap.xml file');
            }
            Parser.parseString(xmlString.toString(), (err, res) => {
                if (err) {
                    console.error(err);
                }
                resolve(res);

            });
        });
    });
}

/*
* Deletes all the URLs that have /id/ in their path. We can't exclude these URLs in the generator because otherwise URLs that need to be in the sitemap
* are not. So we remove them here and rewrite the sitemap.
* @params {sitemap}: name of the XML sitemap whose identifiers URLs are to be deleted
*
* NOTE: in this function also wrong URLs are deleted.
* Apparently wrong URLs are formed by the sitemap-generator, e.g. https://data.vlaanderen.be/ns/www.cipalschoubroek.be
* These URLs need to be removed
* */
async function deleteIdentifierURLs(sitemap) {
    let URLs = await XMLToJSON(sitemap);

    const xw = new XMLWriter(true);
    xw.startDocument();
    xw.startElement('urlset');

    for (let i = 0; i < URLs.urlset.url.length; i++) {
        let URL = URLs.urlset.url[i].loc[0];

        if (URL.indexOf('/id/') < 0 && URL.substring(URL.lastIndexOf('/'), URL.length).indexOf('www.') < 0) {
            xw.startElement('url')
                .writeElement('loc', URLs.urlset.url[i].loc[0])
                .writeElement('changefreq', URLs.urlset.url[i].changefreq[0])
                .writeElement('priority', URLs.urlset.url[i].priority[0])
                .writeElement('lastmod', URLs.urlset.url[i].lastmod[0]);
            xw.endElement();
        }
    }
    xw.endDocType();
    fs.createWriteStream(sitemap).write(xw.toString());
}

module.exports = { urlType, createKeywords, convertURLsToJSON, XMLToJSON, deleteIdentifierURLs };
