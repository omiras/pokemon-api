import express, { json, Router } from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import cors from 'cors';


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const apiRouter = Router(); // Nuevo enrutador para las rutas API

app.use('/api/v1', apiRouter); // Monta las rutas en el prefijo '/api/v1'


apiRouter.use(json());
apiRouter.use(cors());

const uri = process.env.MONGODB_URI;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToDatabase() {
    await client.connect();
    return client.db("pokemon");
}

apiRouter.get('/pokemon/:pokemonName', async (req, res) => {
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

apiRouter.get('/pokemon-species/:id', async (req, res) => {
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

apiRouter.get('/pokemon', async (req, res) => {
    const db = await connectToDatabase();
    const collection = db.collection("Pokemon");

    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const baseUrl = req.protocol + '://' + req.get('host');

    const totalPokemons = await collection.countDocuments();
    const nextUrl = offset + limit < totalPokemons ? `${baseUrl}/pokemon?offset=${offset + limit}&limit=${limit}` : null;
    const previousUrl = offset - limit >= 0 ? `${baseUrl}/pokemon?offset=${Math.max(offset - limit, 0)}&limit=${limit}` : null;

    let pokemonList = await collection.find({}, { projection: { name: 1, _id: 0 } })
        .skip(offset)
        .limit(limit)
        .toArray();


    const responseObj = {
        count: totalPokemons,
        next: nextUrl,
        previous: previousUrl,
        results: pokemonList.map((pokemon) => {
            return {
                name: pokemon.name,
                url: `${baseUrl}/pokemon/${pokemon.name}`,
            };
        }),
    };

    res.json(responseObj);
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
