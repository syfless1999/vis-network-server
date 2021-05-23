# Vis-Network Server
A completing large scale visual network server, use typescript, express and neo4j completing large scale network visualization web server, use typescript, express and neo4j.
Nice to contribute to it!

## Install
install nodejs project dependencies
```bash
npm install
```

Then edit `.env` to configure your database info to server, `<xxxx>` is sth you should replace by your info.

```
// server port
PORT=<ServerPort>

// MongoDB
MONGODB_DATABASE_URL=mongodb://127.0.0.1:<MPort>/<DBName>

// Neo4j
NEO4j_DATABASE_USERNAME=<NUsername>
NEO4j_DATABASE_PASSWORD=<NPwd>
NEO4j_DATABASE_URL=bolt://127.0.0.1:<NPort>
```

## Run

The precise is that you have **neo4j** server in your environment, then start it

```
<NEO4J_HOME>/neo4j start
```
And run **MongoDB** service in your environment too. If you use brew in macOS, you can run it with the follow command

```
brew service start mongodb
```

Then run nodejs app, you have 

1. **watch** you can listen to the code's change and restart servcer
```
npm run watch
```
2. **start** convert the ts code to js code and run it(without auto-reload)
```
npm run start
```
3. **build** only convert ts code to js code
```
npm run build
```



