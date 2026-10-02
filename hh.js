require('dotenv').config();
const mysql = require("mysql2");
const express = require("express");
const cors = require("cors");
const app = express();
 const sql2= `
        SELECT
            c.id,
            c.user_id,
            c.product_id,
            c.weight,
            c.quantity,
            c.price,
            p.name,
            p.image
        FROM cart c
        JOIN product p
            ON c.product_id = p.id
        WHERE c.user_id = ?
    `;
function get_colum(table, value,cloum=null,data=null) {
  return new Promise((resolve, reject) => {
    let sql;
    let params=[];
    if (cloum==null && data==null){
      sql = `SELECT * FROM ${table}`;
    }
    else{
      if(table=='cart'){
        sql=`SELECT p.name,p.description,p.price_1kg,p.image,p.discount,c.quantity,c.weight FROM cart c JOIN product p ON c.product_id = p.id WHERE c.user_id =?`
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
app.use(cors());
app.use(express.json());
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});
db.connect((err) => {
  if (err) {
    console.log("MySQL connection failed");
    console.log(err);
    return;
  }
  console.log("MySQL connected");
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

app.listen(PORT);
