const express = require('express');
const router = express.Router();
const logger = require('logplease').create('api');
const filesystem = require('fs');
const afilesystem = require('fs').promises;
const childprocess = require('child_process')
const path = require('path');
const URL = require('url').URL;

const { userpool, adminpool } = require('../src/database');
const verify = require('../src/verify');
const { config, dataDirectories } = require('../src/config');


const isValidURL = (s) => {
    try {
      new URL(s);
      return true;
    } catch (err) {
      return false;
    }
};

const downloadFile = async (url, filePath) => {
    return new Promise((resolve, reject) => {
        const fileStream = filesystem.createWriteStream(filePath);
        const curl = childprocess.spawn('curl', [url]);

        curl.stdout.on('data', (data) => { 
            fileStream.write(data); 
        });

        curl.stderr.on('error', (data) => {
            throw new Error(data)
        })

        curl.stdout.on('end', (data) =>  {
            fileStream.end();
            logger.info('downloaded ' + filePath);
            resolve();
        });

        curl.on('exit', (code) =>  {
            if (code != 0) {
                logger.error('download failed -' + code);
                reject();
            }
        
            resolve()
        });
    })
};

router.post('/add', async (req, res) => {
    const {
        id,
        username,
        isTeacher,
        classes
    } = req.body;

    if(isTeacher === 'true'){
        try{
            logger.info('adding teacher - ' + id)
            const newUser = await adminpool.query("INSERT INTO teachers (id, username, classes) VALUES ($1, $2, $3) RETURNING *", [id, username, classes]);
            logger.info('added teacher - ' + newUser.rows[0].id)
        } catch(err){
            logger.error('error while adding teacher ' + err)
            return res.status(500).json({
                message: 'could not add to databasr'
            })
        }

    } else if(isTeacher === 'false'){
        try{
            logger.info('adding student - ' + id)
            const newUser = await adminpool.query("INSERT INTO students (id, username, classes) VALUES ($1, $2, $3) RETURNING *", [id, username, classes]);
            logger.info('added student - ' + newUser.rows[0].id)
            return res.status(200).json({
                message: newUser.rows[0].id
            })
        } catch(err){
            logger.error('error while adding student ' + err)
            return res.status(500).json({
                message: 'could not add to databasr'
            })
        }    
    }
})

router.post('/fetch', verify, async (req, res) => {
    if(req.isTeacher){
        try{
            let teachers = [];
            const users = await userpool.query("SELECT id, username, classes FROM teachers;");
            users.rows.forEach(user => {
                const teacher = {
                    id: user.id,
                    username: user.username,
                    classes: user.classes
                }

                teachers.push(teacher)
            })

            return res.status(200).json(teachers);
        } catch(err){
            logger.error('database error ' + err);
            return res.status(500).json({
                message: 'database error'
            })
        } 
    } 

    try {
        let students = [];
            const users = await userpool.query("SELECT id, username, classes FROM students;");
            users.rows.forEach(user => {
                const student = {
                    id: user.id,
                    username: user.username,
                    classes: user.classes
                }

                students.push(student)
            })

            return res.status(200).json(students);
    } catch(err){
            logger.error('database error ' + err);
            return res.status(500).json({
                message: 'database error'
        })
    }
    
})

router.post('/addAssignment', verify, async (req, res) => {
    try{
        if(!req.isTeacher){
           return res.status(401).json({
               message: 'user must be a teacher'
           })
        }

        try{
            const { 
                classes,
                marks,
                deadline,
                contentURL,
            } = req.body;

            if(!classes || typeof(classes) !== 'object'){
                return res.status(400).json({
                    message: `classes must be an array`,
                });
            }

            if(!marks || typeof(marks) !== 'number'){
                return res.status(400).json({
                    message: `marks must be an integer`,
                });
            }

            if(!deadline || typeof(deadline) !== 'string'){
                return res.status(400).json({
                    message: `deadline must be a string`,
                });
            }

            if(!contentURL){
                return res.status(400).json({
                    message: 'contentURL must be specified'
                })
            }

            if (typeof contentURL !== 'string') {
                return res.status(400).json({
                    message: `contentURL is required as a string`,
                });
            }

            if (!isValidURL(contentURL)){
                return res.status(400).json({
                    message: `contentURL must be a valid URL`,
                });
            }
            
            let assignmentID = null;

            try { 
                const newAssignment = await adminpool.query("INSERT INTO assignments (classes, owner, marks, deadline) VALUES ($1, $2, $3, to_timestamp($4 / 1000.0)) RETURNING *", [classes, req.id, marks, deadline]);
                assignmentID = newAssignment.rows[0].id;

                logger.info('adding assignment ' + assignmentID)
            } catch(err){
                logger.error('database error ' + err)
                return res.status(500).json({
                    message: 'database error'
                })
            }
            
            try {
                let fileDirectory = path.join(config.dataDirectory, dataDirectories.assignments, assignmentID);
                let submitDirectory = path.join(config.dataDirectory, dataDirectories.submissions, assignmentID);
                let filePath = path.join(fileDirectory, 'content')

                await afilesystem.mkdir(fileDirectory, { mode: 0o600 });
                await afilesystem.mkdir(submitDirectory, { mode: 0o600 });

                await downloadFile(contentURL, filePath)
                await afilesystem.chown(fileDirectory, 0, 0);

                const addedDate = Date.now();
                await afilesystem.writeFile(path.join(fileDirectory, '.addedon'), `${addedDate}`, (err) => {
                    if(err){;
                        throw new error('error writing file ' + err);
                    }
                })
    
            } catch(err){
                logger.error('error while creating assignment file ' + err);
                return res.status(500).json({
                    message: 'server error!'
                })
            }

            logger.info('added assignment ' + assignmentID)
            return res.status(200).json({
                id: assignmentID
            })

        } catch(err){
            return res.status(400).json({
                message: 'error parsing data'
            })
        }
    } catch(err){
        logger.info('server error ' + err);
        return res.status(500).json({
            message: 'server error!'
        })
    }
})

router.post('/updateAssignment', verify, async (req, res) => {
    try{
        if(!req.isTeacher){
           return res.status(401).json({
               message: 'user must be a teacher'
           })
        }

        try{
            const {
                id, 
                classes,
                marks,
                deadline,
                contentURL,
            } = req.body;

            if(!id || typeof(id) !== 'string'){
                return res.status(400).json({
                    message: 'id must be a string!'
                })
            }

            if(typeof(classes) !== 'object'){
                return res.status(400).json({
                    message: `classes must be an array`,
                });
            }

            if(typeof(marks) !== 'number'){
                return res.status(400).json({
                    message: `marks must be an integer`,
                });
            }

            if(typeof(deadline) !== 'string'){
                return res.status(400).json({
                    message: `deadline must be a string`,
                });
            }

            if (typeof contentURL !== 'string') {
                return res.status(400).json({
                    message: `contentURL is required as a string`,
                });
            }

            if (!isValidURL(contentURL)){
                return res.status(400).json({
                    message: `contentURL must be a valid URL`,
                });
            }
            
            try {
                let fileDirectory = path.join(config.dataDirectory, dataDirectories.assignments, id);

                if(classes && classes !== ""){
                   await adminpool.query("UPDATE assignments SET classes = ($2) WHERE id = ($1);", [id, classes])
                   logger.info('updated classes for' + id)
                }

                if(marks && marks !== ""){
                    await adminpool.query("UPDATE assignments SET marks = ($2) WHERE id = ($1);", [id, marks])
                    logger.info('updated marks for' + id)
                }

                if(deadline && deadline !== ""){
                    await adminpool.query("UPDATE assignments SET deadline = (to_timestamp($2 / 1000.0)) WHERE id = ($1);", [id, deadline])
                    logger.info('updated deadline for' + id)
                }

                if(contentURL && contentURL !== ""){
                    try {
                        let filePath = path.join(fileDirectory, 'content')
        
                        await afilesystem.rm(filePath)
                        await downloadFile(contentURL, filePath)
                        await afilesystem.chown(fileDirectory, 0, 0);
                    } catch(err){
                        logger.error('error while creating assignment file ' + err);
                        return res.status(500).json({
                            message: 'server error!'
                        })
                    }

                    logger.info('updated assignment ' + id)
                }

                try{
                    const updateDate = Date.now();
                    filesystem.writeFile(path.join(fileDirectory, '.updatedon'), `${updateDate}`, err => {
                        if(err){
                            throw new error('error writing file ' + err);
                        }
                    })
                } catch(err){
                    logger.error('error writing updatedon file ' + err)
                    return res.status(500).json({
                        message: 'server error'
                    })
                }

                return res.status(200).json({
                    id: id
                })
            } catch(err){
                logger.error('database error ' + err)
                return res.status(500).json({
                    message: 'database error'
                })
            }

        } catch(err){
            logger.error('error parsing data ' + err)
            return res.status(500).json({
                message: 'server error'
            })
        }

    } catch(err){
        logger.info('server error ' + err);
        return res.status(500).json({
            message: 'server error!'
        })
    }
})

router.post('/getAssignment', verify, async (req, res) => {
    try {
        const {
            assignmentID
        } = req.body;

        if(!assignmentID || typeof(assignmentID) !== 'string'){
            return res.status(400).json({
                message: 'specify assignmentID as a string'
            })
        }

        const assignmentPath = path.join(config.dataDirectory, dataDirectories.assignments, assignmentID)
        const assignment = await userpool.query("SELECT id, marks, deadline, classes FROM assignments WHERE id = ($1);", [assignmentID])
        const content = path.join(assignmentPath, 'content')
        let addedOn = null
        let updatedOn = null

        filesystem.readFile(path.join(assignmentPath, '.addedon'), 'utf-8', (err, data) => {
            if(err){
                throw new Error('error while reading ' + err)
            }         
            
            addedOn = data;
        });

        if(filesystem.existsSync(path.join(assignmentPath, '.updatedon'))){
            filesystem.readFile(path.join(assignmentPath, '.updatedon'), 'utf-8', (err, data) => {
                if(err){
                    throw new Error('error while reading ' + err)
                }
    
                updatedOn = data;
            });
        }

        logger.info('fetched assignment ' + assignmentID)
        return res.status(200).json({
            id: assignment.rows[0].id,
            addedOn : Date(addedOn),
            updateOn : updatedOn === null ? 'not updated' : `${updatedOn}`,
            marks: assignment.rows[0].marks,
            deadline: assignment.rows[0].deadline,
            classes: assignment.rows[0].classes,
            content: `${content}`
        })

    } catch(err){
        logger.error('error fetching assignment ' + id + ': ' + err)
        return res.status(500).json({
            message: 'server error'
        })
    }
})

router.post('/getAssignments', verify, async (req, res) => {
    try {
        const assignments = await userpool.query("SELECT id, marks, deadline, classes FROM assignments;")
        let list = [];

        assignments.rows.forEach((assignment) => {
            const item = {
                id: assignment.id,
                marks: assignment.marks,
                deadline: assignment.deadline,
                classes: assignment.classes,
                content: path.join(config.dataDirectory, dataDirectories.assignments, assignment.id , 'content')
            }
            
            list.push(item)
        })              
        
        return res.status(200).json({
            assignments: list
        })

    } catch(err){
        logger.error('error fetching assignments ' + err)
        return res.status(500).json({
            message: 'server error'
        })
    }
})

router.post('/updateClass', verify, async (req, res) => {
    if(!req.isTeacher){
        return res.status(401).json({
            message: 'user must be a teacher'
        })
    }

    try{
        const {
            id,
            newclass,
        } = req.body;

        try {
            await adminpool.query("UPDATE students SET classes = ($2) WHERE id = ($1)", [id, newclass]);
            logger.info('updated student ' + id)
            return res.status(200).json({
                message: 'updated successfully'
            })
        } catch(err){
            logger.error('database error ' + err);
            return res.status(500).json({
                message: 'database error'
            })
        }

    } catch(err){
        logger.error('error parsing data ' + err)
        return res.status(500).json({
            message: 'server error'
        })
    }
})

router.post('/submit', verify, async (req, res) => {
    if(req.isTeacher){
        return res.status(401).json({
            message: 'must be a student to submit'
        })
    }

    try {
        const {
            files,
            assignmentID,
        } = req.body;

        if(!files || typeof(files) !== 'object'){
            return res.status(400).json({
                message: 'files must be an array'
            })
        }

        files.forEach(file => {
            if(!file.content || typeof(file.content) !== 'string'){
                return res.status(400).json({
                    message: 'specify file content as a string'
                })
            }
    
            if(!isValidURL(file.content)){
                return res.status(400).json({
                    message: 'file content is an invalid URL'
                })
            }
            
            if(file.name === '.submiton' || file.name === '.graded'){
                logger.info('user ' + req.id + ' tried creating ' + file.name)
                return res.status(400).json({
                    message: 'filename invalid'
                })
            }
        });

        if(!assignmentID || typeof(assignmentID) !== 'string'){
            return res.status(400).json({
                message: 'specify assignmentID as a string'
            })
        }

        try {
            const submitdate = Date.now();
            const deadline = await userpool.query("SELECT deadline FROM assignments WHERE ID=($1)", [assignmentID]);
            
            if(submitdate > Date.parse(deadline.rows[0].deadline)){
                return res.status(402).json({
                    message: "deadline passed, cannot submit"
                })
            }

            let fileDirectory = path.join(config.dataDirectory, dataDirectories.submissions, assignmentID, req.id);

            if(filesystem.existsSync(fileDirectory)){
                filesystem.rm(fileDirectory, {recursive: true, force: true}, (err) => {
                    if(err){
                        throw new Error('could not delete existing directory ' + err)
                    }
                })
            }

            filesystem.mkdir(fileDirectory, { mode: 0o600 , recursive: true }, (err) => {
                if(err){
                    throw new Error('could not create directory ' + err.message)
                }                    
            });

            Promise.all(files.map(async(file, i) => {
                let contentPath = path.join(fileDirectory, file.name || `file${i}`)
                await downloadFile(file.content, contentPath)
            })).catch(err => {
              logger.error(err.message)
            });

            await afilesystem.chown(fileDirectory, 0, 0);

            filesystem.writeFile(path.join(fileDirectory, '.submiton'), `${submitdate}`, err => {
                if(err){
                    throw new error('error writing file ' + err);
                }
            })

            return res.status(200).json({
                message : 'submitted successfully',
                student : req.id
            })

        } catch(err){
            logger.error('error while creating submission file ' + err);
            return res.status(500).json({
                message: 'server error!'
            })
        }

    } catch (err) {
        logger.error('server error ' + err);
        return res.status(500).json({
            message: 'server error!'
        })
    }
})

router.post('/getSubmissions', verify, async (req, res) => {
    if(!req.isTeacher){
        return res.status(401).json({
            message: 'must be a teacher to view submissions'
        })
    }

    try {
        const {
            assignmentID
        } = req.body;

        let assignmentDirectory = path.join(config.dataDirectory, dataDirectories.submissions, assignmentID);
        filesystem.readdir(assignmentDirectory, (err, files) => {
            if(err){
                throw new Error('error reading ' + err)
            }

            return res.status(200).json({
                submissions: files
            })
        })

    } catch(err){
        logger.error('server error ' + err)
        return res.status(500).json({
            message: "server error!"
        })
    }
})

router.post('/getSubmission', verify, async (req, res) => {
    try{
        const {
            assignmentID
        } = req.body;

        let submissionDirectory = path.join(config.dataDirectory, dataDirectories.submissions, assignmentID, req.id);
        if(!filesystem.existsSync(submissionDirectory)){
            return res.status(400).json({
                message: 'submission does not exist'
            })
        }

        if(!filesystem.existsSync(submissionDirectory, '.submiton')){
            throw new Error('no submiton file ' + err)
        }
 
        let submission = [];
        let response = {
            submission: {},
            submittedOn: "",
            grade: "not graded"
        }

        filesystem.readdir(submissionDirectory, (err, files) => {
            if (err){
              throw new Error('error reading ' + err)
            }

            files.forEach((file) => {
                if(file === '.submiton'){
                    try{
                        response.submittedOn = Date(filesystem.readFileSync(path.join(submissionDirectory, '.submiton'), 'utf-8'))
                    } catch(err){
                            logger.error('error reading content ' + err);
                            throw new Error(err);
                    }          
                }

                else if(file === '.graded'){
                    try {
                        response.grade = filesystem.readFileSync(path.join(submissionDirectory, '.graded'), 'utf-8')
                    } catch(err){
                            throw new Error('error reading content ' + err);
                    }
                }

                else {
                    const item = {
                        file: file,
                        directory: `${path.join(submissionDirectory, file)}`
                    }

                    submission.push(item)
                }
            })

            response.submission = submission;
            return res.status(200).json(response)
        })

    } catch(err){
        logger.error('server error ' + err);
        return res.status(500).json({
            message: 'server error!'
        })
    }
})

module.exports = router;