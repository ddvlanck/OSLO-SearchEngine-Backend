require('es6-promise').polyfill();
require('isomorphic-fetch');
const fs = require('fs');
const xml2js = require('xml2js');
const Parser = new xml2js.Parser({attrkey: "ATTR"});
const Helper = require('./Helper');
const config = require('./config');
const XMLWriter = require('xml-writer');
const getHrefs = require('get-hrefs');

/*
* Reads all URLs from the sitemap.xml file and executes two functions.
* The first function converts to URLs to JSON objects with metadata.
* The second function gets all the fragment identifiers present in the HTML body of the URL
* */
async function convertDataFromSitemap(){
    const data = await Helper.XMLToJSON(config.ORIGINAL_SITEMAP);

    let indexedURLs = Helper.convertURLsToJSON(data.urlset.url);
    let indexedFIs = await getFragmentIdentifiers(data.urlset.url);

    return [indexedURLs, indexedFIs];
}

/*
* Compares the original sitemap to the new sitemap. New URLs are extracted and returned by this function
* New sitemap overrides old sitemap.
* */
async function compareToOriginalSiteMap() {
    let originalURLs = await XMLToJSON(config.ORIGINAL_SITEMAP);
    const convertedOriginalURLs = originalURLs.urlset.url.map(a => a.loc[0]);

    let update = await XMLToJSON('test.xml');

    // Compare two sitemaps so that we only have to push new URLs to Elasticsearch
    let newURLs = [];
    update.urlset.url.forEach(url => {
        if (!convertedOriginalURLs.includes(url.loc[0])) {
            originalURLs.push(url);
            newURLs.push(url);
        }
    });

    // Write originalData (which can be updated) back to sitemap.xml
    const xw = new XMLWriter(true);
    xw.startDocument('1.0', 'UTF-8', 'yes');
    xw.startElement('urlset');

    for (let i = 0; i < URLs.urlset.url.length; i++) {
        xw.startElement('url')
            .writeElement('loc', URLs.urlset.url[i].loc[0])
            .writeElement('changefreq', URLs.urlset.url[i].changefreq[0])
            .writeElement('priority', URLs.urlset.url[i].priority[0])
            .writeElement('lastmod', URLs.urlset.url[i].lastmod[0]);
        xw.endElement();
    }
    xw.endDocType();
    fs.createWriteStream(config.ORIGINAL_SITEMAP).write(xw.toString());

    // Delete the sitemap-update.xml file
    fs.unlinkSync('./sitemap-update.xml');

    return newURLs;
}

/*
* Gets all fragment identifiers for the list of URLs
* @params {urls}: list of objects containing the URLs (output from XML converter)
* */
async function getFragmentIdentifiers(urls) {
    let FIs = [];
    for (let index in urls) {
        let FI = await getFragmentIdentifiersForURL(urls[index].loc[0]);
        FIs = FIs.concat(FI);
    }
    return FIs;
}

/*
* Actual function that retrieves the fragment identifiers present in the HTML body of the URL
* Creates an array of JSON objects containing the fragment identifier and information about the identifier.
* @params {url} : a URL
* */
async function getFragmentIdentifiersForURL(url) {
    let html = await fetch(url).then(res => {
        return res.text()
    });
    let hrefs = getHrefs(html);
    hrefs = hrefs.filter(href => href.indexOf('#') === 0);  // Only keep fragment identifiers from this URL. (not those who refer to another domain);

    let fragmentIdentifiers = [];

    hrefs.forEach(fi => {

        if (!config.INVALID_FRAGMENTS_IDENTIFIERS.includes(fi)) {
            // Remove any hexidecimal signs (%3A is a [point]. %20 represents a space and can not be removed in the URL. However, for the keywords, it will be removed)
            const fi_pretty = fi.replace('%3A', '.');

            // Determine if the fragment identifier points to a property, class (or json-ld context)
            let isProperty = false;
            // Term is a property if it starts with lowercase or a point occurs in the string
            if (fi_pretty.charAt(1) == fi_pretty.charAt(1).toLowerCase() || fi_pretty.indexOf('.') >= 0) {
                isProperty = true;
            }

            // Get name of the term
            let name = fi_pretty.split('.').length > 1 ? fi_pretty.substr(fi_pretty.indexOf('.') + 1, fi_pretty.length) : fi_pretty.substr(1, fi_pretty.length);
            name = name.replace(/%20/g, ' ');

            // Generate keywords that will be queried
            const keywords = fi_pretty.replace(/%20/g, ' ').substring(1, fi_pretty.length).split('.');

            // Determine type of term
            let type;
            if (fi_pretty.indexOf('jsonld') >= 0) {
                type = 'Context';

                //If FI is jsonld context, it means the URL is of an applicationprofile (AP)
                // So we add the name of the AP
                let apName = url.substring(url.indexOf('applicatieprofiel') + 18, url.length - 1);
                keywords.push(apName);

                // We also change the name of the object (otherwise its name will be 'jsonld')
                name = 'JSON-LD context van ' + apName;

            } else {
                type = isProperty ? 'Eigenschap' : 'Klasse';
            }

            // If we have a JSON-LD context, we need to construct the proper URL for it
            // Otherwise we construct the regular URL by preceding the FI with https://data.vlaanderen.be/...
            let URL;
            if (type === 'Context') {

                // We must take into account the two version of the toolchain.
                // For the new version of the toolchain, the URI structure is different

                // For the OLD version, URLs end with '/'
                if(url.charAt(url.length) === '/'){
                    URL = 'https://data.vlaanderen.be/context/' + keywords[keywords.length - 1] + '.jsonld';
                } else {
                    URL = url + 'context/' + keywords[keywords.length - 1] + '.jsonld'
                }


            } else {
                URL = url + fi; // 'url' is the parameter of the function
                                // Here we use variable 'fi' because URL needs to contain the hexidecimal numbers for points and spaces
            }

            fragmentIdentifiers.push(
                {
                    url: URL,
                    keywords: keywords,
                    type: type,
                    name: name
                });
        }
    });
    return fragmentIdentifiers;
}

module.exports = { getFragmentIdentifiers, compareToOriginalSiteMap, convertDataFromSitemap};




