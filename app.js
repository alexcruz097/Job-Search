const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const config = require("./config")
// Load the full build.
const PORT = process.env.PORT || 5000;
let _ = require("lodash");
const ejs = require("ejs");
const app = express();
// use this variable to store the data from the api
let jobData = "";
// command to use ejs engine
app.set("view engine", "ejs");
// able to use public folder
app.use(express.static("public"));
// use this command to be able to use data from the form
app.use(bodyParser.urlencoded({
    extended: true
}));
// data needed for the request to work
const apiKey = config.API_KEY;
const appID = config.APP_ID;
// querys to make url request
let jobTitle;
let location;
let datePosted;
let maxDist;
let jobType;
let currentPage;
let results = [];
let numOfJobsFound;

// our error message
let errorMessageCode = "";
let noJobFoundMSG = "";

// home page route
app.get("/", (req, res) => {
    res.render("home");
});

//home page route post request
app.post("/", (req, res) => {
    jobTitle = _.lowerCase(req.body.jobTitle);
    location = _.lowerCase(req.body.location);
    datePosted = req.body.datePosted;
    maxDist = req.body.maxDist;
    jobType = req.body.jobType;
    currentPage = 1;
    // use this variable to be able add data and late parse it
    https.get(
        `https://api.adzuna.com/v1/api/jobs/us/search/${currentPage}?what=${jobTitle}&where=${location}&${datePosted}&${maxDist}&${jobType}&app_id=${appID}&app_key=${apiKey}`,
        (response) => {
            let data = "";
            console.log(response.statusCode);
            // action if the https goes thru
            if (response.statusCode === 200) {
                response.on("data", (notJson) => {
                    data += notJson;
                });
                // if code error is not because of user input: do this
            }
            // if the server con not find a job that matches the clien request
            else if (response.statusCode === 400) {
                noJobFoundMSG =
                    " we couldnt find a job that matches your needs. Please try using other keywords";
                res.redirect("/error");
            } else if (response.statusCode !== 200 && response.statusCode !== 400) {
                errorMessageCode += `your request came with a  ${response.statusCode.toString()} Code :(`;
                res.redirect("/error");
            }
            //   when the data is finish we will redirect to showJobs
            response.on("end", () => {
                jobData = JSON.parse(data);
                results = jobData.results;
                numOfJobsFound = jobData.count;
      
                
                // check if returned data has content and if not redirect them to error
                if (jobData.count > 0) {
                    res.redirect(`/showJobs/${currentPage}`);
                } else if (response.statusCode === 200 && numOfJobsFound === 0) {
                    noJobFoundMSG =
                        " we couldnt find a job that matches your needs. Please try using other keywords";
                    res.redirect("/error");
                }
            });
        }
    );
});
// show all jobs route
app.get("/showJobs/:page", (req, res) => {
    // get the total num of pages by dividing the num of jobs by 10
    let numberOfPages = Math.ceil(numOfJobsFound / 10);

    res.render("showJobs", {
        results: results,
        currentPage: currentPage,
        numberOfPages: numberOfPages,
        numOfJobsFound: numOfJobsFound
    });
});

app.post("/showJobs/:page", (req, res) => {
    let prevPage = req.body.prevPage;
    let nextPage = req.body.nextPage;
    if (nextPage) {
        currentPage++;
    } else if (prevPage) {
        if (currentPage >= 1) {
            currentPage--;
        }
    }

    console.log(currentPage);
   https.get(
        `https://api.adzuna.com/v1/api/jobs/us/search/${currentPage}?what=${jobTitle}&where=${location}&${datePosted}&${maxDist}&${jobType}&app_id=${appID}&app_key=${apiKey}`,
        (response) => {
            let data = "";
            console.log(response.statusCode);
            // action if the https goes thru
            if (response.statusCode === 200) {
                response.on("data", (notJson) => {
                    data += notJson;
                });
                // if code error is not because of user input: do this
            }
            // if the server con not find a job that matches the clien request
            else if (response.statusCode === 400) {
                noJobFoundMSG =
                    " we couldnt find a job that matches your needs. Please try using other keywords";
                res.redirect("/error");
            } else if (response.statusCode !== 200 && response.statusCode !== 400) {
                errorMessageCode += `your request came with a  ${response.statusCode.toString()} Code :(`;
                res.redirect("/error");
            }
            //   when the data is finish we will redirect to showJobs
            response.on("end", () => {
                jobData = JSON.parse(data);
                // get results from json and add it to the "results" variable
                results = jobData.results;
                numOfJobsFound = jobData.count;
                // get the contract time and remove the underscore
                         jobLength = _.lowerCase(results.contract_time);
                // check if returned data has content and if not redirect them to error
                if (jobData.count > 0) {
                    res.redirect(`/showJobs/${currentPage}`);
                } else if (response.statusCode === 200 && numOfJobsFound === 0) {
                    noJobFoundMSG =
                        " we couldnt find a job that matches your needs. Please try using other keywords";
                    res.redirect("/error");
                }
            });
        }
    );
});
// show indivugual job post
app.get("/jobPost/:id", (req, res) => {
    let jobID = req.params.id;
    // iterage over array to see if the id to match that job post
    results.forEach((job, index) => {
        if (job.id === jobID) {
            res.render("jobPost", {
                applyURL : job.redirect_url,
                jobIndex: index + 1,
                jobTitle: job.title,
                company: job.company.display_name,
                description: job.description,
                location: job.location.display_name,
                jobType: job.contract_time,
                dayCreated: job.created,
                jobID: jobID,
                currentPage: currentPage,
            });
        }
    });
});
// route to go thru web pages

// https://api.adzuna.com/v1/api/jobs/us/search?what=web-developer&where=91406&app_id=cb9b746c&app_key=7e9b32838574c60128c14a6097952806&content-type=application/json

// error route
app.get("/error", (req, res) => {
    res.render("error", {
        errorMessageCode: errorMessageCode,
        noJobFoundMSG: noJobFoundMSG,

    });
});

// start web server
app.listen(PORT, () => {
    console.log(`The server is running in port: ${PORT}`);
});