require("dotenv").config()
const multer = require("multer");
const mongoose = require("mongoose")
const express = require('express');
const app = express();
const File = require('./models/File')
const bcrypt = require('bcrypt')

app.use(express.urlencoded({extended: true}))

mongoose.set("strictQuery", true);
mongoose.connect(process.env.DATABASE_URL)

const upload = multer({dest: "uploads"})

app.set("view engine", "ejs")

app.get('/', (req, res) => {
    res.render("index")
})

app.post('/upload', upload.single("file"), async(req, res) => {
    const fileData = {
        path:req.file.path,
        originalName: req.file.originalname
    }

    if (req.body.password !== null && req.body.password !== "") {
        fileData.password = await bcrypt.hash(req.body.password, 10)
    }
    

    const file = await File.create(fileData)
    
    res.render("index", {fileLink: `${req.headers.origin}/file/${file.id}`})
})


app.route('/file/:id').get(handleDownload).post(handleDownload)
/* app.get('/file/:id', handleDownload)
app.post('/file/:id', handleDownload) */


//Function for handling get and post request
async function handleDownload(req, res) {
    const file = await File.findById(req.params.id);

    if (file.password != null) {
      if (req.body.password == null) {
        res.render("password");
        return;
      }

      if (!(await bcrypt.compare(req.body.password, file.password))) {
        res.render("password", { error: true });
        return;
      }
    }
    file.downloadCount++;
    await file.save();
    console.log(file.downloadCount);

    res.download(file.path, file.originalName);
}

app.listen(process.env.PORT, () => {
    console.log("Server is listening on port 8080.. So go get it.")
})