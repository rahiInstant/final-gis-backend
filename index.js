const express = require("express");
const cors = require("cors");
const app = express();
const client = require("./db.js");

require("dotenv").config();

const port = process.env.port || 3000;

app.use(express.json());
app.use(
  cors({
    origin: ["http://127.0.0.1:5500", "https://gisfinal.netlify.app"],
    credentials: true,
  })
);

app.get("/", async (req, res) => {
  const result = await client.query("select * from valves limit 2");
  console.log(result.rows);
  res.status(200).send("home");
});

app.post("/data", async (req, res) => {
  const table = req.body.table;
  //   console.log(table);
  const result = await client.query(
    `select *, st_asgeojson(geom) as geojson from ${table}`
  );
  const featureCollection = {
    type: "FeatureCollection",
    features: result.rows.map((item) => {
      return {
        type: "Feature",
        geometry: JSON.parse(item.geojson),
        properties: item,
      };
    }),
  };
  res.send(featureCollection);
});

app.post("/find-data", async (req, res) => {
  const data = req.body;
  const table = data.table;
  const field = data.field;
  const value = data.value;
  const result = await client.query(
    `select *, st_asgeojson(geom) as geojson from ${table} where ${field} = '${value}'`
  );
  const featureCollection = {
    type: "FeatureCollection",
    features: result.rows.map((item) => {
      return {
        type: "Feature",
        geometry: JSON.parse(item.geojson),
        properties: item,
      };
    }),
  };
  res.send(featureCollection);
});

app.post("/insert-data", async (req, res) => {
  let isExist;
  const data = req.body;
  const query = {
    valves: `insert into valves (valve_id, valve_type, valve_dma_id, valve_diameter, 
    valve_visibility, valve_location, geom) values ('${data.valve_id}', '${data.valve_type}',
    '${data.valve_dma_id}', '${data.valve_diameter}', '${data.valve_visibility}', '${data.valve_location}', 
    st_setsrid(st_geomfromgeojson(' ${data.valve_geometry}'), 4326))`,
    pipelines: `insert into pipelines (pipe_id, pipeline_category, pipeline_dma_id, pipeline_diameter, 
   pipeline_method, pipeline_location, geom) values ('${data.pipe_id}', '${data.pipe_type}',
    '${data.pipe_dma_id}', '${data.pipe_diameter}', '${data.pipe_method}', '${data.pipe_location}', 
     st_setsrid(st_geomfromgeojson('${data.pipe_geometry}'), 4326))`,
    buildings: `insert into buildings (building_id, building_category, building_dma_id, 
	building_storey, building_population, building_location, geom) values ('${data.building_id}', 
    '${data.building_type}', '${data.building_dma_id}', 
	'${data.building_storey}', '${data.building_population}', '${data.building_location}', 
	ST_SetSRID(ST_GeomFromGeoJSON('${data.building_geometry}'), 4326) )`,
  };
  if (data.request == "valves") {
    isExist = await client.query(
      `select * from valves where valve_id = '${data.valve_id}'`
    );
  } else if (data.request == "pipelines") {
    isExist = await client.query(
      `select * from pipelines where pipe_id = '${data.pipe_id}'`
    );
  } else if (data.request == "buildings") {
    isExist = await client.query(
      `select * from buildings where building_id = '${data.building_id}'`
    );
  }

  if (isExist?.rowCount > 0) {
    res.status(404).send({ message: "data already exist." });
  } else {
    const result = await client.query(query[data.request]);
    res.send(result);
    // console.log(query[data.request]);
    // console.log(result)
  }
});

app.post("/delete-data", async (req, res) => {
  const data = req.body;
  const query = {
    valves: `DELETE FROM valves WHERE valve_id = '${data.id}'`,
    pipelines: `DELETE FROM pipelines WHERE pipe_id = '${data.id}'`,
    buildings: `DELETE FROM buildings WHERE building_id = '${data.id}'`,
  };
  const result = await client.query(query[data.request]);

  console.log(result);
  res.send(result);
});

app.listen(port, () => {
  console.log(`server is running at port: ${port}`);
});
