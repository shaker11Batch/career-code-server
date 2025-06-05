const express = require('express')
const cors = require('cors')
const app = express()
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;

require('dotenv').config()
// middleware 
app.use(cors(
    {
        origin: ['http://localhost:5173'],
        credentials: true
    }
))
app.use(express.json())
app.use(cookieParser())

// const logger = (req, res, next) => {
//     console.log('inside the logger middlerware')
//     next()
// }

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    // 1st token na takle 
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    // virefy token 
    jwt.verify(token, process.env.JWT_ACCESS_SECRET,
        (err, decoded) => {
            if (err) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            req.decoded = decoded;
            next()
        }
    )
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5qkscdg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        const jobsCollection = client.db('JobCareer').collection('jobs')
        const applicatiosCollectin = client.db('JobCareer').collection('applications')


        // jwt token related apis 

        app.post('/jwt', async (req, res) => {
            const userInfo = req.body;
            console.log(userInfo)
            const token = jwt.sign(userInfo, process.env.JWT_ACCESS_SECRET,
                { expiresIn: '2h' })

            res.cookie('token', token, {
                httpOnly: true,
                secure: false
            })

            res.send({ success: true })
        })



        // jobs api 
        app.get('/jobs', async (req, res) => {
            const email = req.query.email;
            const query = {}
            if (email) {
                query.hr_email = email;
            }
            const result = await jobsCollection.find(query).toArray();
            res.send(result)
        })

        // job koita apply korche 
        app.get('/jobs/applications',verifyToken, async (req, res) => {
            const email = req.query.email;
            const query = { hr_email: email }
            const jobs = await jobsCollection.find(query).toArray()
            // should use aggregate to have optimum data fetching
            for (const job of jobs) {
                const applicationQuery = { id: job._id.toString() }
                const application_count = await applicatiosCollectin.countDocuments(applicationQuery)
                job.application_count = application_count
            }
            res.send(jobs)
        })


        app.get('/applications/job/:job_id', async (req, res) => {
            const job_id = req.params.job_id;
            console.log(job_id)
            const query = { id: job_id }
            const result = await applicatiosCollectin.find(query).toArray()
            res.send(result)
        })

        app.patch('/applications/:id', async (req, res) => {
            const id = req.params.id
            console.log(id)
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: req.body.status
            }
            const result = await applicatiosCollectin.updateOne(filter, updateDoc)
            res.send(result)
        })
        // could be done but should nat be done
        // app.get('/jobsByEmailAddress', async (req, res) => {
        //     const email = req.query.email;
        //     const query = { hr_email: email }
        //     const result = await jobsCollection.find(query).toArray()
        //     res.send(result)
        // })


        // job post

        app.post('/jobs', async (req, res) => {
            const newJob = req.body;
            console.log(newJob)
            const result = await jobsCollection.insertOne(newJob)
            res.send(result)
        })


        // find one data

        app.get('/jobs/:id', async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.findOne(query)
            res.send(result)
        })


        // job applications related api

        app.post('/applications', async (req, res) => {
            const application = req.body;
            console.log(application)
            const result = await applicatiosCollectin.insertOne(application);
            res.send(result);
        })

        app.get('/applications', async (req, res) => {
            const email = req.query.email;
            // console.log('insite applications', req.cookies)
            // if (email !== req.decoded.email) {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }

            const query = {
                applicant: email
            }

            const result = await applicatiosCollectin.find(query).toArray()

            // bad way to aggregate data 
            for (const application of result) {
                const jobId = application.id;
                const jobQuery = { _id: new ObjectId(jobId) }
                const job = await jobsCollection.findOne(jobQuery)
                application.company = job.company
                application.title = job.title
                application.company_logo = job.company_logo
            }


            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);














app.get('/', (req, res) => {
    res.send('Career Code Cooking')
})

app.listen(port, () => {
    console.log(`carrer code running ${port}`)
})