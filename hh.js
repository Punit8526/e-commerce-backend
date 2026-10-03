const fs = require("fs");
require('dotenv').config();
const mysql = require("mysql2");
const express = require("express");
const cors = require("cors");
const app = express();
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        ca: fs.readFileSync("./ca.pem")
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 20000
});
function get_colum(table, value,cloum=null,data=null) {
  return new Promise((resolve, reject) => {
    let sql;
    let params=[];
    if (cloum==null && data==null){
      sql = `SELECT * FROM ${table}`;
    }
    else{
      if(table=='cart'){
        sql=`SELECT p.name,p.description,p.price_1kg,p.image,p.discount,c.quantity,c.id,c.weight FROM cart c JOIN product p ON c.product_id = p.id WHERE c.user_id =?`
        params=[data]
      }
      else{
      sql = `SELECT * FROM ${table} WHERE ${cloum} = ?`;
      params=[data]
      }
    }
    db.query(sql,params, (err, result,fields) => {
      if (err) {
        reject(err);
        return;
      }
      if (value === true) {
        // Return column names except first column
        const cloum_name =fields.map(field => field.name).slice(1);
        resolve(cloum_name);
      } else {
        // Return complete table data
        resolve(result);
      }
    });
  });
}
app.use(cors({
    origin: [
        "http://localhost:4200",
        "https://mhadevmasala.netlify.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

db.getConnection((err, connection) => {
    if (err) {
        console.log("MySQL connection failed");
        console.log(err);
        return;
    }

    console.log("Aiven MySQL connected successfully!");
    connection.release();
});
app.post("/api/:value", async (req, res) => {
  let values = [];
  try {
    const table = req.params.value;
    const cloum_name = await get_colum(table, true);
    for (let key in cloum_name) {
      values.push(req.body[cloum_name[key]]);
    }
    const placeholders = cloum_name.map(() => "?").join(", ");
    const sql = ` INSERT INTO ${table} (${cloum_name.join(", ")}) VALUES (${placeholders}) `;
    db.query(sql, values, (err, result) => {
      if (err) {
        console.log("MYSQL INSERT ERROR:");
        console.log(err);
        console.log("ERROR CODE:", err.code);
        console.log("ERROR MESSAGE:", err.message);
        return res.status(500).json({
          message: "Database insert failed",
          error: err.message,
        });
      }
      res.status(201).json({
        message: `${table} registered successfully`,
        id: result.insertId,
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Database error",
      error: error.message,
    });
  }
});
app.get("/", (req, res) => {
    res.json({
        message: "Backend running"
    });
});


app.post('/api/:t_name/:value', async (req, res) => {
   try {
    const value1 = req.params.value;
    const table = req.params.t_name;
    const{
      cloumn,
      value
    }=req.body;
    let cloum_name;
    if (value1=="true"){
        cloum_name = await get_colum(table, false,cloumn,value);
        }
    else{
        cloum_name = await get_colum(table, false);
    }
            res.status(200).json({
            message: 'User found',
            user: cloum_name
        });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Database error",
      error: error.message,
    });
  }  
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
