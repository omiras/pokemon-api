import express, { json } from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(json());

const uri = process.env.MONGODB_URI;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToDatabase() {
    await client.connect();
    return client.db("pokemon");
}

app.get('/pokemon/:pokemonName', async (req, res) => {
    const db = await connectToDatabase();
    const collection = db.collection("Pokemon");

    const pokemonName = req.params.pokemonName;
    const pokemon = await collection.findOne({ name: pokemonName });

    if (pokemon) {
        res.json(pokemon);
    } else {
        res.status(404).json({ error: 'Pokemon not found' });
    }
});

app.get('/pokemon-species/:id', async (req, res) => {
    const db = await connectToDatabase();
    const collection = db.collection("Species");

    const speciesId = parseInt(req.params.id);
    const species = await collection.findOne({ id: speciesId });

    if (species) {
        res.json(species);
    } else {
        res.status(404).json({ error: 'Species not found' });
    }
});

app.get('/pokemon', async (req, res) => {

    const db = await connectToDatabase();
    const collection = db.collection("Pokemon");

    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    let pokemonList = await collection.find({}, { projection: { name: 1, _id: 0 } })
        .skip(offset)
        .limit(limit)
        .toArray();

    const baseUrl = req.protocol + '://' + req.get('host');
    pokemonList = pokemonList.map((pokemon) => {
        return {
            ...pokemon,
            url: `${baseUrl}/pokemon/${pokemon.name}`,
        };
    });

    res.json(pokemonList);
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
