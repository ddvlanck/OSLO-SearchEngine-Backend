const elasticsearch = require('elasticsearch');

/*
* Called in the main method and CRON job to create an Elasticsearch client
* */
function createElasticsearchClient(hostURL){
    const client = new elasticsearch.Client({
        hosts: [hostURL]
    });

    client.ping({
        requestTimeout: 30000
    }, function(error){
       // At this point, elasticsearch is down, we need to check the service
        if(error){
            // At this point, eastic search is down, please check your Elasticsearch service
            if (error) {
                console.error('\x1b[31m%s\x1b[0m ', "Elasticsearch cluster is down")
            } else {
                console.log('\x1b[32m%s\x1b[0m ', "Elasticsearch cluster/client is running");
            }
        }
    });

    return client;
}

/*
* Creates an index in Elasticsearch
* @params {client} :  an Elasticsearch client
* @params {name} : the name of the index
* */
function createElasticsearchIndex(client, name){
    client.indices.create({
        index: name
    }, function (error, response, status) {
        if (error) {
            console.log(error);
        } else {
            console.log("Created a new index: " + name, response);
        }
    });
}


/*
* Pushes data in bulk mode to the Elasticsearch engine
* @params {client} : an Elasticsearch client
* @params {data} : array with JSON objects
* @params {index} : index where data will be stored
* @params {type} : type of the data
* */
function addDataInBulkMode(client, data, index, type){
    // Declare an empty array called bulk
    let bulk = [];

    // Loop through each URL and create and push two objects into the array in each loop
    // first object sends the index and type you will be saving the data as
    // second object is the data you want to index
    data.forEach(url => {
        bulk.push({
            index: {
                _index: index,
                _type: type,
            }
        })
        bulk.push(url)
    });

    // Perform bulk indexing of the data passed
    client.bulk({body: bulk}, function (err, response) {
        if (err) {
            console.log("Failed Bulk operation ", err)
        } else {
            console.log("Successfully imported ", data.length);
        }
    });
}

module.exports = {createElasticsearchClient, createElasticsearchIndex, addDataInBulkMode};
