# OSLO-SearchEngine-Backend

Deze repository bevat de backend-logica voor de zoekmachine voor Open Standaarden voor Linkende Organisaties (OSLO). De zoekmachine maakt
gebruikt van ElasticSearch om de data in op te slaan en queries op los te laten.

## Installatie

```
> npm run install
```

### 

Er moet ook een docker-container opgestart worden voor Elasticsearch:

```
> docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.6.0
```
