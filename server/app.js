import express from 'express';
import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator';
import bodyParser from "body-parser";
import Kafka from 'kafkajs';
import  CreateProducer  from '../server/kafka/producer.js';
import  CreateConsumer  from '../server/kafka/consumer.js';
import alert from 'alert'



import mysql from 'mysql';
var pool  = mysql.createPool({
    connectionLimit : 10,
    host            : 'localhost',
    user            : 'root',
    password        : 'pranav',
    database        : 'WhatsAppDB'
  });

const port = 4000;
import cors from 'cors';
const app = express();
// use it before all route definitions
app.use(cors({origin: ['http://localhost:3000','http://localhost:3001' ]}));

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())

app.get('/kafka', (req, res) => {
    console.log('----------------------------\n');
    res.json({mes: 'kafka producer check'});
})

app.get('/OTPVerify', (req, res) => {
    // console.log("Your OTP is ---> ",req.query.otp);
    pool.query(`select * from OTP where OTP = "${req.query.otp}"`, [], (error, results1, fields) => {
        if (error) throw error;
        pool.query(`select * from users where email = ?`, 
        [results1[0].email],
        (error, results, fields) => {
            if(error) throw error;
            console.log("USer name ", results[0].name)
            res.json({email: results1[0].email,
                                  name:  results[0].name
            });
        })
        // console.log("OTP Matched --> ",results1, results1.length,)
        // res.send("You are Logged In Succesfully :)", )
    })
})

app.post('/form', (req, res) => {
    pool.query(`INSERT INTO users (email, password, name)
                VALUES ( ?, ?, ? ) `, 
                [req.body.email, req.body.password, req.body.name], 
                (error, results, fields) => {
                    if(error) throw error;
                    console.log("New user inserted into users table--->", results);
                    // res.send("Chat posted to the WhatsApp Database with id ", String(results.insertId))
                    res.status(200).json({id: results})
    })
    console.log(req.body)
    alert('New Contact added to the users table')

})

app.post('/chat', (req,res)=>{
    pool.query(`INSERT INTO messages (chatFrom, sendTo, message, timestamp,sendToName, chatFromName)
                VALUES ( ?, ?, ?, ?, ?, ? ) `, 
                [req.body.chatFrom, req.body.sendTo, req.body.message, req.body.timestamp,req.body.sendToName,req.body.chatFromName ], 
                (error, results, fields) => {
                    if(error) throw error;
                    console.log("Inserted the chat into messages table--->", results);
                    // res.send("Chat posted to the WhatsApp Database with id ", String(results.insertId))
                    console.log("chatFrom--> ", req.body.chatFrom)
                    console.log("sendTo--> ", req.body.sendTo)
                    console.log("sendToName--> ", req.body.sendToName)
                    console.log("chatFromName--> ", req.body.chatFromName)
                    res.status(200).json({id: results});
    })
})

app.get('/chat', (req, res) => {
    pool.query(` SELECT * FROM messages 
        WHERE ( (sendTo = "${req.query.sendTo}" and chatFrom = "${req.query.chatFrom}")
        or (chatFrom = "${req.query.sendTo}" and sendTo = "${req.query.chatFrom}")  )
        ORDER BY timestamp ; `,
        [], (error, results, fields) => {
        res.json({
            messagesList: results
        });
    })
})

app.get('/chatList', (req, res) => {
    pool.query(` SELECT * FROM contacts 
                WHERE chatReceivedFromMailID = "${req.query.sendTo}" `, 
                [], (error, results, fields) => {
                res.json({
                    messagesList: results
                });
    })
})

app.get('/requestChat', (req, res) => {
    pool.query(` SELECT reqFrom, reqFromMail FROM requests 
                WHERE reqToMail = "${req.query.ownermail}" `, 
                [], (error, results, fields) => {
                    console.log("backend req chats ---> ", results)
                    res.json({
                        reqList: results
                    });
    })
})

app.get('/login', (req, res) => {
    pool.query( `select email from users where email = "${req.query.mail}"`, [], (error, results, fields) => { 
        if (error) throw error;
        console.log("results --> ",results, results.length)
        
        if(results.length == 1){
            var OTPValue = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
            pool.query(`INSERT INTO OTP (email, OTP) VALUES ( '${req.query.mail}' ,'${OTPValue}') `, [], (error, results, fields) => {
                if(error) throw error;
            })
            let mailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'rockstarmsp2001@gmail.com',
                    pass: 'jvrqnavitdlzgtkc'
                }
            });

            let mailDetails = {
                from: 'rockstarmsp2001@gmail.com',
                to: `${req.query.mail}`,
                subject: 'OTP for WhatsApp Log In',
                text: `Your OTP is ${OTPValue}`
            };
            console.log('otp value ---> ', OTPValue)
            mailTransporter.sendMail(mailDetails, (err, data) => {
                if(err) {
                    console.log('Error Occurs', err);
                    alert('An Error Occured')
                } else {
                    console.log('Email sent successfully');
                    alert(' OTP Email sent successfully')
                }
            });

        }
        else{
            let mailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'rockstarmsp2001@gmail.com',
                    pass: 'jvrqnavitdlzgtkc'
                }
            });

            let mailDetails = {
                from: 'rockstarmsp2001@gmail.com',
                to: `${req.query.mail}`,
                subject: 'Register for WhatsApp Web',
                text: 'You have not registed in the users table, please register here http://localhost:3000/form'
            };

            mailTransporter.sendMail(mailDetails, (err, data) => {
                if(err) {
                    console.log('Error Occurs', err);
                    alert('An Error Occured')
                } else {
                    console.log('Email sent successfully');
                    alert('Register Email sent successfully')
                }
            });
        }
      });
    console.log("Email --> ", req.query.mail )
    res.send("Log In")
})


app.post('/acceptedChat', (req, res) => {
    pool.query(`INSERT INTO contacts ( chatReceivedFrom, chatReceivedFromMailID, sendTo, sendToMailID)
                VALUES ( ?, ?, ?, ? ) `, 
                [ req.body.chatReceivedFrom, req.body.chatReceivedFromMailID, req.body.sendTo, req.body.sendToMailID], 
                (error, results, fields) => {
                    if(error) throw error;
                    console.log("Accepted Contact inserted into contacts table--->", results);
                    alert("Accepted Contact inserted into contacts table")
                    // res.send("Chat posted to the WhatsApp Database with id ", String(results.insertId))
                    res.status(200);
    })
    pool.query(`DELETE FROM requests WHERE reqFromMail='${req.body.sendToMailID}'; `,  
    (error, results, fields) => {
        if(error) throw error;
        console.log("Accepted Contact deleted from requests table--->", results);
        alert(" Request Accepted")
        // res.send("Chat posted to the WhatsApp Database with id ", String(results.insertId))
        res.status(200).json({id: results})
    })
})


app.post('/rejectedChat', (req, res) => {
    pool.query(`DELETE FROM requests WHERE reqFromMail='${req.body.sendToMailID}'; `,  
                (error, results, fields) => {
                    if(error) throw error;
                    console.log("Rejected Contact deleted from requests table--->", results);
                    alert(" Request Rejected")
                    // res.send("Chat posted to the WhatsApp Database with id ", String(results.insertId))
                    res.status(200).json({id: results});
    })
    // console.log(req.body)
})


app.post('/requestChat', (req, res) => {
    console.log(req.body.mail)
    pool.query( `select email from users where email = "${req.body.mail}"`, [], (error, results, fields) => { 
        if (error) throw error;
        console.log("results --> ",results, results.length)
        
        if(results.length == 1){
        //     // var OTPValue = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
        //     // pool.query(`INSERT INTO OTP (email, OTP) VALUES ( '${req.query.mail}' ,'${OTPValue}') `, [], (error, results, fields) => {
        //     //     if(error) throw error;
        //     //     console.log("Results for OTP ---> ", results);
        //     // }) `${'http://localhost:3000/chat'}

            
            let mailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'rockstarmsp2001@gmail.com',
                    pass: 'jvrqnavitdlzgtkc'
                }
            });

            let mailDetails = {
                from: 'rockstarmsp2001@gmail.com',
                to: `${req.body.mail}`,
                subject: 'Request for Chatting on WhatsApp Web',
                text: `http://localhost:3000/`
            };

            mailTransporter.sendMail(mailDetails, (err, data) => {
                if(err) {
                    console.log('Error Occurs', err);
                    alert('An Error Occured')
                } else {
                    console.log('Email sent successfully');
                    alert('Request Email sent successfully')
                }
            });

        }
        else{
            let mailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'rockstarmsp2001@gmail.com',
                    pass: 'jvrqnavitdlzgtkc'
                }
            });

            let mailDetails = {
                from: 'rockstarmsp2001@gmail.com',
                to: `${req.body.mail}`,
                subject: 'Register',
                text: 'http://localhost:3000/form'
            };

            mailTransporter.sendMail(mailDetails, (err, data) => {
                if(err) {
                    console.log('Error Occurs', err);
                    alert('An Error Occured')
                } else {
                    console.log('Email sent successfully');
                    alert('Register Email sent successfully')
                }
            });
        }
        pool.query(`INSERT INTO requests (reqFrom, reqFromMail, reqToMail)
                VALUES ( ?, ?, ? ) `, 
                [ req.body.reqFrom, req.body.reqFromMail ,req.body.mail], 
                (error, results, fields) => {
                    if(error) throw error;
                    console.log("New request inserted into requests table--->", results);
                    // res.send("Chat posted to the WhatsApp Database with id ", String(results.insertId))
                    alert("New request inserted into requests table")
                    res.status(200);
    })
    });
    // console.log("Email --> ", req.query.mail )
    res.send("Log In")
})

const server = app.listen(port, () => console.log(`Express app running on port ${port}!`));
