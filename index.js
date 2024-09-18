const express = require("express");
const cors = require("cors");
const app = express();

require("dotenv").config();

const port = process.env.port || 3000;

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://127.0.0.1:5501",
      "https://finalgis.netlify.app",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

app.get("/", async (req, res) => {
  const result = await client.query("select * from valves limit 2");
  console.log(result.rows);
  res.status(200).send("home");
});

// app.post("/data", async (req, res) => {
//   const table = req.body.table;
//   //   console.log(table);
//   const result = await client.query(
//     `select *, st_asgeojson(geom) as geojson from ${table}`
//   );
//   const featureCollection = {
//     type: "FeatureCollection",
//     features: result.rows.map((item) => {
//       return {
//         type: "Feature",
//         geometry: JSON.parse(item.geojson),
//         properties: item,
//       };
//     }),
//   };
//   res.send(featureCollection);
// });

// app.post("/find-data", async (req, res) => {
//   const data = req.body;
//   const table = data.table;
//   const field = data.field;
//   const value = data.value;
//   const result = await client.query(
//     `select *, st_asgeojson(geom) as geojson from ${table} where ${field} = '${value}'`
//   );
//   const featureCollection = {
//     type: "FeatureCollection",
//     features: result.rows.map((item) => {
//       return {
//         type: "Feature",
//         geometry: JSON.parse(item.geojson),
//         properties: item,
//       };
//     }),
//   };
//   res.send(featureCollection);
// });

// app.post("/insert-data", async (req, res) => {
//   let isExist;
//   const data = req.body;
//   const query = {
//     valves: `insert into valves (valve_id, valve_type, valve_dma_id, valve_diameter,
//     valve_visibility, valve_location, geom) values ('${data.valve_id}', '${data.valve_type}',
//     '${data.valve_dma_id}', '${data.valve_diameter}', '${data.valve_visibility}', '${data.valve_location}',
//     st_setsrid(st_geomfromgeojson(' ${data.valve_geometry}'), 4326))`,
//     pipelines: `insert into pipelines (pipe_id, pipeline_category, pipeline_dma_id, pipeline_diameter,
//    pipeline_method, pipeline_location, geom) values ('${data.pipe_id}', '${data.pipe_type}',
//     '${data.pipe_dma_id}', '${data.pipe_diameter}', '${data.pipe_method}', '${data.pipe_location}',
//      st_setsrid(st_geomfromgeojson('${data.pipe_geometry}'), 4326))`,
//     buildings: `insert into buildings (building_id, building_category, building_dma_id,
// 	building_storey, building_population, building_location, geom) values ('${data.building_id}',
//     '${data.building_type}', '${data.building_dma_id}',
// 	'${data.building_storey}', '${data.building_population}', '${data.building_location}',
// 	ST_SetSRID(ST_GeomFromGeoJSON('${data.building_geometry}'), 4326) )`,
//   };
//   if (data.request == "valves") {
//     isExist = await client.query(
//       `select * from valves where valve_id = '${data.valve_id}'`
//     );
//   } else if (data.request == "pipelines") {
//     isExist = await client.query(
//       `select * from pipelines where pipe_id = '${data.pipe_id}'`
//     );
//   } else if (data.request == "buildings") {
//     isExist = await client.query(
//       `select * from buildings where building_id = '${data.building_id}'`
//     );
//   }

//   if (isExist?.rowCount > 0) {
//     res.status(404).send({ message: "data already exist." });
//   } else {
//     const result = await client.query(query[data.request]);
//     res.send(result);
//     // console.log(query[data.request]);
//     // console.log(result)
//   }
// });

// app.post("/delete-data", async (req, res) => {
//   const data = req.body;
//   const query = {
//     valves: `DELETE FROM valves WHERE valve_id = '${data.id}'`,
//     pipelines: `DELETE FROM pipelines WHERE pipe_id = '${data.id}'`,
//     buildings: `DELETE FROM buildings WHERE building_id = '${data.id}'`,
//   };
//   const result = await client.query(query[data.request]);

//   console.log(result);
//   res.send(result);
// });
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://safepark:DdtY5CfCtlHsF6KX@parking.z2eyy.mongodb.net/?retryWrites=true&w=majority&appName=parking`;

// const uri = "mongodb://localhost:27017";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    // DB Name
    const parkingDB = client.db("safePark");
    const parkingInfo = parkingDB.collection("parkingInfo");
    const CCC_ROADS = parkingDB.collection("CCC_ROADS");

    app.post("/insert-parking-data", async (req, res) => {
      const data = req.body;
      const result = await parkingInfo.insertOne(data);
      res.send(result);
    });

    app.get("/get-parking-data", async (req, res) => {
      const result = await parkingInfo.find().toArray();
      const featureCollection = {
        type: "FeatureCollection",
        features: result.map((item) => {
          return {
            type: "Feature",
            geometry: JSON.parse(item.location_point),
            properties: item,
          };
        }),
      };
      res.send(featureCollection);
    });
    app.patch("/update-doc", async (req, res) => {
      const filter = {
        name: req.body.name,
      };
      const updateDoc = {
        $inc: {
          booked: 1,
          blankSlot: -1,
        },
      };
      const result = await parkingInfo.updateOne(filter, updateDoc);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`server is running at port: ${port}`);
});
