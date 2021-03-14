const port = 8080;

const express = require('express');
const app = express();

const jsondb = require('simple-json-db');
const db = new jsondb(__dirname+'/data/urls.json');

const child_process = require("child_process");

app.use(express.Router(), express.urlencoded(), express.static(__dirname+'/static'));
app.set('view engine', 'ejs');
app.set('views', __dirname+'/pages');
app.engine('html', require('ejs').render);

app.get('/create', (req,res)=>{
    res.render('create.ejs', {
        error: ""
    });
});
app.post('/create/submit', (req,res)=>{
    // url & type
    if((req.body.url && req.body.url.trim() != "") && (req.body.type && req.body.type.trim() != "") && (req.body.type == "curl" || req.body.type == "ping")) {
        let json = db.JSON();
        if(json.hasOwnProperty(req.body.url)) {
            res.render('create.ejs', {
                error: "URL is in use."
            });
        } else {
            let can = true;
            try {
                new URL(req.body.url);
            } catch(e) {
                can = false;
            }
            if(can) {
                db.set(req.body.url, req.body.type);
                res.redirect('/create/created?loc='+encodeURIComponent(req.body.url));
            } else {
                res.render('create.ejs', {
                    error: "Invalid URL"
                });
            }
        }
    } else {
        res.render('create.ejs', {
            error: "Invalid arguments"
        });
    }
});
app.get('/create/created', (req,res)=>{
    // query = {loc}
    if(req.query.loc) {
        let can = true;
        try {
            new URL(req.query.loc);
        } catch(e) {
            can = false;
        }
        if(can) {
            res.render('created.ejs', {
                loc: req.query.loc
            });
        } else {
            res.render('error.ejs');
        }
    } else {
        res.render('error.ejs');
    }
});

const ping = ()=>{
    let urls = db.JSON();
    for(let url in urls) {
        let cUrlType = urls[url];
        url = url.replace(/^https?:\/\//gi, "");

        if(cUrlType == "ping") {
            let p = child_process.spawn('ping', [url]);
            p.stdout.on('data', (data)=>{
                console.log("Data: "+data.toString());
            });
            p.on('close', ()=>{
                console.log('Ended ping.');
            });
        } else if(cUrlType == "curl") {
            let p = child_process.spawn('curl', [url]);
            p.stdout.on('data', (data)=>{
                console.log("Data: "+data.toString());
            });
            p.on('close', ()=>{
                console.log('Ended curl.');
            });
        }
    }
}

setInterval(ping, 300000);
ping();

app.listen(port, ()=>console.log("[Server] Listening on :"+port));
