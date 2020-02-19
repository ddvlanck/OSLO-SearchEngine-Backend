# OSLO Zoekmachine - Backend

De zoekmachine voor OSLO (Open Standaarden voor Linkende Organisaties) bestaat uit 3 delen:
1. **Elasticsearch**
1. **NodeJs backend**
1. [Vue frontend](https://github.com/ddvlanck/OSLO-SearchEngine-Frontend)

De bovenste twee vormen samen de volledige backend en is beschikbaar in deze repository. De werking van deze delen wordt hier toegelicht, terwijl de werking van de frontend wordt toegelicht in zijn eigen repository.

## Elasticsearch

Elasticsearch is een open source, RESTful zoekmachien gebouwd werd bovenop Apache Lucene. Het is Java-gebaseerd en kan data in eender welk formaat indexeren, maar laat ook toe om queries los te laten op die data.

Er zijn verschillende manieren om een instantie van de zoekmachine te starten, maar de meest eenvoudige is via Docker:
	- Docker pull docker.elastic.co/elasticsearch/elasticsearch:7.6.0
	- Docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.6.0

De commando's hierboven zorgen ervoor dat een single-node cluster in Elasticsearch wordt opgestart. Indien gewenst kunnen meerdere nodes opgestart worden (voor meer info vind je [hier](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html)). Eenmaal opgestart kan de Elasticsearch-instantie bevraagt worden door requests te versturen op poort 9200. Dezelfde poort dient ook gebruikt te worden om data in Elasticsearch toe te voegen. Een overzicht van de verschillende queries die verstuurd kunnen worden naar de zoekmachine kan [hier](https://dzone.com/articles/23-useful-elasticsearch-example-queries) teruggevonden worden.

## NodeJS backend

In de backend worden de data verzamelt die dan gevoed worden aan de Elasticsearch-instantie. Het proces beingt met een crawler die start op de website data.vlaanderen.be en alle routes tracht te vinden die er bestaan. Op het einde wordt een sitemap gemaakt waarin alle routes zitten. Wanneer de crawler alle routes heeft gevonden wordt een sitemap gemaakt waarin alle routes zitten. 

Eenmaal dit proces is afgelopen wordt deze sitemap ingelezen en worden allerlei functies op deze informatie losgelaten zodat uiteindelijk meer metadata (kernwoorden, type URL, ...) hebben voor elk van onze routes op de website. Uiteindelijk hebben we de data in JSON-formaat en die worden dan in bulk-modus verstuurd naar de Elasticsearch-instantie.

Verder wordt een CRON-job opgestart die elke maand het bovenstaande proces zal uitvoeren om na te gaan of er nieuwe routes zijn bijgekomen. Indien dit het geval zou zijn, dan worden ze op die manier ook toegevoegd aan Elasticsearch. De originele sitemap (van bij de start) wordt altijd bijgehouden. Het uitvoeren van de CRON-job zorgt ervoor dat een nieuwe sitemap gegenereerd wordt. Deze zal de originele niet overschrijven, maar worden vergeleken met elkaar. Enkel nieuwe routes uit de nieuwe sitemap worden overgehouden en toegevoegd aan de originele sitemap. De originele sitemap wordt dus telkens uitgebreid. De nieuwe routes worden dan ook toegevoegd aan de Elasticsearch-instantie.

Om de backend te starten moet er reeds een Elasticsearch-instantie reeds actief zijn (zie stappen hierboven). Vervolgens volstaat het om volgende commando's uit te voeren:

```
> npm install
> node index.js
```

