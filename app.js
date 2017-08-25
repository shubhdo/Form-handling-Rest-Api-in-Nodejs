const express = require('express')
const body_parser = require('body-parser');
const mongoose = require('mongoose');
const indicative = require('indicative');
const async = require('async');
let User = require('./user');
let Marks = require('./marks');

let url = 'mongodb://localhost:27017/formhandler';
mongoose.connect(url, {
    useMongoClient: true
});
let db = mongoose.connection;


const app = express();
app.use(body_parser.json());

app.use(body_parser.urlencoded({extended: false}));


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});


let rules = {
    name: 'required',
    password: 'required',
    dob: 'required',
    contact: 'required|min:9|max:14',
    email: 'required|email',
    address: 'required',
    studyInfo: 'required'

};


app.post('/registration', (req, res) => {
    let nameVal = req.body.name1;
    let passwordVal = req.body.password1;
    let dobVal = req.body.dob1;
    let contactVal = req.body.contact1;
    let emailVal = req.body.email1;
    let addressVal = req.body.address1;
    let studyInfoVal = req.body.studyInfo1;

    if (new Date().getYear() - new Date(dobVal).getYear() <= 10) {
        res.status(400).send({error: "Age Should be greater than 10 "});
        return;
    }

    if (!Number.isInteger(contactVal)) {
        res.status(400).send({error: "Contact should be Number"});
        return;
    }


    let regUser = new User({
        name: nameVal,
        password: passwordVal,
        dob: dobVal,
        contact: contactVal,
        email: emailVal,
        address: addressVal,
        studyInfo: studyInfoVal

    });

    User.findOne({email: emailVal}, (err, result) => {
        if (err) {
            res.status(500).send({error: "something failed"});
        }

        else {
            if (result === null) {
                indicative.validateAll(regUser, rules)
                    .then(function () {

                        regUser.save((err, userval) => {
                            if (err) {
                                res.status(400).send({error: "something failed"});
                            }
                            else {

                                res.status(200).json({
                                    responseCode: 200,
                                    responseMessage: 'User has succesfully register',
                                    result: userval
                                });

                            }
                        })
                    })
                    .catch(err => {
                        res.status(400).send(err.message);
                    });
            }
            else {
                res.status(404).send({error: "Email already exist. Please Choose Unique email"});
            }
        }
    });


});

app.post('/login', (req, res) => {
    let emailValue = req.body.email1;
    let passwordValue = req.body.password1;
    User.findOne({email: emailValue}, {password: 1}, (err, result) => {
        if (err) {
            res.status(500).send({error: "something failed"});
        }

        else {
            if (result === null) {
                res.status(404).send({error: "Email does not exist. Please registar"});
            }
            else {

                if (passwordValue === result.password) {
                    res.status(200).json({
                        responseCode: 200,
                        responseMessage: 'User has succesfully login',
                        result: result
                    });
                }
                else {
                    res.status(404).send({error: "Password is incorrect"});

                }

            }
        }
    })
});


let MarkRules = {
    id: 'required',
    hindi: 'required',
    english: 'required',
    maths: 'required',
    science: 'required',
    geography: 'required'
};

app.post('/addMarks', (req, res) => {

    let id = req.body.documentId;

    if (mongoose.Types.ObjectId.isValid(id)) {

        User.findOne({_id: id}, (error, result) => {
            if (error) {
                res.status(500).send({error: "something failed"});
            }
            else if (result === null) {
                res.status(400).send({error: "User does not exist. Marks cannot be inserted"});
            }
            else {
                let hindi = req.body.hindi1;
                let english = req.body.english1;
                let maths = req.body.maths1;
                let science = req.body.science1;
                let geography = req.body.geography1;

                if (!Number.isInteger(hindi) || !Number.isInteger(english) || !Number.isInteger(maths) || !Number.isInteger(science) || !Number.isInteger(geography)) {
                    res.status(400).send({error: "All marks should be Number"});
                    return;
                }

                if (hindi < 0 || english < 0 || maths < 0 || science < 0 || geography < 0) {
                    res.status(400).send({error: "Marks should be greater than 0"});
                    return;
                }
                if (hindi > 100 || english > 100 || maths > 100 || science > 100 || geography > 100) {
                    res.status(400).send({error: "Marks should be less than or equal 100"});
                    return;
                }
                let marksSave = new Marks({
                    id: id,
                    hindi: hindi,
                    english: english,
                    maths: maths,
                    science: science,
                    geography: geography
                });
                indicative.validateAll(marksSave, MarkRules).then(() => {

                    marksSave.save((err, result) => {
                        if (err) {
                            console.log(err);
                            res.status(400).send({error: "Marks are already added"});
                        }
                        else {
                            console.log(result);
                            res.status(200).json({
                                responseCode: 200,
                                responseMessage: 'Marks are added',
                                result: result
                            });

                            User.update({_id: req.id}, {$set: {marksId: result._id}}, function (err, res) {
                                if (err) console.log(err)
                                else
                                    console.log(res);
                            })


                        }
                    })
                }).catch(error => {
                    console.log(error);
                    res.status(400).send(error);
                })
            }

        });

    }
    else {
        res.status(400).send({error: "String should be a valid ObjectId"});
    }

});

app.put('/updateUser', (req, res) => {

    let criteria = req.body.criteria;
    let updateValue = req.body.updateValue;
    if (mongoose.Types.ObjectId.isValid(criteria)) {

        if (updateValue.dob !== undefined && new Date().getYear() - new Date(updateValue.dob).getYear() <= 10) {
            res.status(400).send({error: "Age Should be greater than 10 "});
            return;
        }

        if (updateValue.contact !== undefined && !Number.isInteger(updateValue.contact)) {
            res.status(400).send({error: "Contact should be Number"});
            return;
        }


        if (updateValue.email !== undefined) {
            res.status(400).send({"error": "email cannot be changed"});
            return;
        }


        User.findOneAndUpdate({_id: criteria}, {$set: updateValue}, {new: true}, (error, result) => {
            if (error) {
                res.status(400).send({error: "something failed "});
            }
            else {
                if (result === null) {
                    res.status(400).json({
                        responseCode: 400,
                        responseMessage: 'Data Not Found',
                        result: result
                    });
                }
                else {
                    res.status(200).json({
                        responseCode: 200,
                        responseMessage: 'Updated Data',
                        result: result
                    });
                }
            }
        });
    }
    else {
        res.status(400).send({error: "String should be a valid ObjectId"});
    }
});


app.put('/updateAddress', (req, res) => {
    let id = req.body.id;
    let addid = req.body.addid;
    let state = req.body.state;
    let city = req.body.city;
    let query;
    let regex = /[a-zA-Z]+/;

    if (state === undefined && city === undefined) {
        res.status(400).send({error: "Send some fields to state"});
        return;
    }
    if (state === undefined && city !== undefined) {
        if (!regex.test(city)) {
            res.status(400).send({error: "Send valid state and city"});
            return;
        }
        query = {
            'address.$.city': city
        }
    }
    if (state !== undefined && city === undefined) {
        if (!regex.test(state)) {
            res.status(400).send({error: "Send valid state"});
            return;
        }
        query = {
            'address.$.state': state,
        }
    }

    if (state !== undefined && city !== undefined) {
        if (!regex.test(state) || !regex.test(city)) {
            res.status(400).send({error: "Send valid state and city"});
            return;
        }
        query = {
            'address.$.state': state,
            'address.$.city': city
        }
    }


    if (mongoose.Types.ObjectId.isValid(id) || mongoose.Types.ObjectId.isValid(addid)) {
        User.update({_id: id, 'address._id': addid}, {
            $set: query
        }, (error, result) => {
            if (error) {
                console.log(error)
                res.status(500).send({error: "something failed "});
            }
            else {

                if (result.nModified === 1) {

                    res.status(200).json({
                        responseCode: 200,
                        responseMessage: 'Field Modified',
                        result: result
                    });
                }
                else {
                    res.status(400).json({
                        responseCode: 400,
                        responseMessage: 'Field cannot be updated',
                        result: result
                    });
                }
            }
        })
    }
    else {
        res.status(400).send({error: "String should be a valid ObjectId"});
    }

});

app.put('/updateStudyInfo', (req, res) => {
    let id = req.body.id;
    let studyid = req.body.studyid;
    let graduateStatus = req.body.graduate;
    let postGraduateStatus = req.body.postGraduate;
    let degree = req.body.degree;


    if (typeof graduateStatus !== "boolean" || typeof postGraduateStatus !== "boolean") {
        res.status(400).send({error: "Send Only Boolean values for status"});
        return;
    }

    if (degree === undefined) {
        res.status(400).send({error: "Send valid Degreee"});
        return;
    }

    if (mongoose.Types.ObjectId.isValid(id) && mongoose.Types.ObjectId.isValid(studyid)) {
        User.update({_id: id}, {
            $set: {
                'studyInfo.graduate': graduateStatus,
                'studyInfo.postGraduate': postGraduateStatus,
                'studyInfo.degree': degree
            }
        }, (error, result) => {
            if (error) {
                console.log(error)
                res.status(500).send({error: "something failed "});
            }
            else {
                if (result.nModified === 1) {

                    res.status(200).json({
                        responseCode: 200,
                        responseMessage: 'Field Modified',
                        result: result
                    });
                }
                else {
                    res.status(400).json({
                        responseCode: 400,
                        responseMessage: 'Field cannot be updated',
                        result: result
                    });
                }
            }

        })
    }
    else {
        res.status(400).send({error: "String should be a valid ObjectId"});
    }

});


app.post('/getStudentInfoOfIds', function (req, res) {
    let arr = req.body.studentIds;
    async.map(arr, find, function (error, result) {
        if (error) {
            res.status(400).send({"error": "something failed"});
        }
        else {
            if (result.length === 0) {
                res.status(400).send({
                    responseCode: 400,
                    responseMessage: "No Id was found in database",
                    result: result
                })
            }
            else {
                res.status(200).send({
                    responseCode: 200,
                    responseMessage: "OK",
                    result: result
                })
            }
        }
    })

});
function find(id, callback) {

    User.findOne({_id: id}, function (error, result) {
        if (error) {
            console.log(error)
            callback(error)
        } else {
            console.log(result)
            callback(null, result);
        }
    })
}

app.get('/getAllStudents', (req, res) => {
    let status = req.query.status;

    let validOp = ["Passed", "Fail"];
    if (validOp.includes(status)) {
        Marks.aggregate(
            {
                $project: {
                    average: {$avg: ['$maths', '$science', '$hindi', '$english', '$geography']},
                    examStatus:
                        {
                            $cond: {
                                if:
                                    {
                                        $gte: [{avg: ['$maths', '$science', '$hindi', '$english', '$geography']}, 33]
                                    }
                                ,
                                then: "Passed",
                                else:
                                    "Fail"
                            }
                        }
                }
                ,
            }, {
                $match: {
                    examStatus: status
                }
            }
            , function (err, result) {
                if (err) {
                    res.status(400).send({error: "something failed "});
                }
                else {
                    if (result.length === 0) {
                        res.status(200).json({
                            responseCode: 200,
                            responseMessage: "OK",
                            result: result
                        });
                    }
                    else {
                        res.status(200).json({
                            responseCode: 200,
                            responseMessage: "OK",
                            result: result
                        });
                    }
                    console.log(result)

                }
            });
    }
    else {
        res.status(400).send({error: "Please enter only Passed and Fail as query"});
    }
});


app.get('/getStatus', (req, res) => {
    let id = req.query.id;
    if (mongoose.Types.ObjectId.isValid(id)) {

        Marks.findOne({id: req.query.id}, (findError, findResponse) => {
            if (findError) {
                res.status(400).send({error: "something failed "});
            }
            else {
                if (findResponse === null) {
                    res.status(400).json({
                        responseCode: 400,
                        responseMessage: 'id not found',
                        result: ""
                    });
                }
                else {
                    Marks.aggregate(
                        {$match: {id: mongoose.Types.ObjectId(id)}},
                        {
                            $project: {
                                average: {$avg: ['$maths', '$science', '$hindi', '$english', '$geography']},
                                examStatus: {
                                    $cond: {
                                        if: {$gte: [{avg: ['$maths', '$science', '$hindi', '$english', '$geography']}, 33]},
                                        then: "Passed",
                                        else: "Fail"
                                    }
                                }
                            }
                        }
                        , function (err, result) {
                            if (err) {
                                res.status(400).send({error: "something failed "});
                            }
                            else {
                                console.log(result)
                                res.status(200).json({
                                    responseCode: 200,
                                    responseMessage: 'Successful',
                                    result: result[0]
                                });
                            }
                        });
                }
            }

        });
    }
    else {
        res.status(400).send({error: "String should be a valid ObjectId"});
    }


});

app.get('/getMarks', (req, res) => {

    if (mongoose.Types.ObjectId.isValid(req.query.id)) {

        Marks.findOne({id: req.query.id}).populate('id')
            .exec((err, result) => {
                if (err) {
                    res.status(400).send({error: "something failed "});
                }
                else {
                    if (result === null) {
                        res.status(400).json({
                            responseCode: 400,
                            responseMessage: 'id not found',
                            result: ""
                        });
                    }
                    else if (result.id === undefined) {
                        let text = {
                            hindi: result.hindi,
                            english: result.english,
                            maths: result.maths,
                            science: result.science,
                            geography: result.geography,
                        };
                        res.status(200).json({
                            responseCode: 200,
                            responseMessage: 'No personal user data found',
                            result: text
                        });
                    }
                    else {
                        let text = {
                            name: result.id.name,
                            UserId: result.id._id,
                            hindi: result.hindi,
                            english: result.english,
                            maths: result.maths,
                            science: result.science,
                            geography: result.geography,
                        };
                        res.status(200).json({
                            responseCode: 200,
                            responseMessage: 'Successful',
                            result: text
                        });
                    }
                }
            }).catch(error => {
            res.status(400).send({error: "something failed "});

        })
    }
    else {
        res.status(400).send({error: "String should be a valid ObjectId"});
    }
});


app.get('/getAverageAndData', (req, res) => {
    let id = req.query.id;
    if (mongoose.Types.ObjectId.isValid(id)) {

        Marks.findOne({id: req.query.id}, (findError, findResponse) => {
            if (findError) {
                res.status(400).send({error: "something failed "});
            }
            else {
                if (findResponse === null) {
                    res.status(400).json({
                        responseCode: 400,
                        responseMessage: 'id not found',
                        result: ""
                    });
                }
                else {
                    Marks.aggregate(
                        {$match: {id: mongoose.Types.ObjectId(id)}},
                        {
                            $lookup:
                                {
                                    "from": "User",
                                    "localField": "id",
                                    "foreignField": "_id",
                                    "as": "data"
                                }
                        }, {
                            $unwind: '$data'
                        }
                        , {
                            $project: {
                                'name': '$data.name',
                                'email': '$data.email',
                                average: {$avg: ['$maths', '$science', '$hindi', '$english', '$geography']},
                                examStatus: {
                                    $cond: {
                                        if: {$gte: ['average', 33]},
                                        then: "Passed",
                                        else: "Fail"
                                    }
                                }
                            }
                        },
                        function (err, result) {
                            if (err) {
                                console.log(err)
                                res.status(400).send({error: "something failed "});
                            }
                            else {
                                console.log(result[0])

                                res.status(200).json({
                                    responseCode: 200,
                                    responseMessage: 'Successful',
                                    result: result[0]
                                });
                            }
                        });
                }
            }

        });
    }
    else {
        res.status(400).send({error: "String should be a valid ObjectId"});
    }
});


app.get('/userlist', (req, res) => {

    User.find({}, {name: 1, email: 1, address: 1, dob: 1, state: 1, city: 1}, function (err, result) {
        if (err) {
            res.status(500).send({error: "something failed"});
        }

        else {
            if (result === null) {
                res.status(404).send({error: "data not found"});
            }
            else {

                res.status(200);
                res.json(result);
            }
        }
    })
});


app.listen(3000, () => {
    console.log('listening on port 3000')
});
