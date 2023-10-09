var express = require('express');
var router = express.Router();
var db  = require('../config/db');
var fs = require('fs');

const multer = require('multer');
const path = require('path');

// Set up multer to store uploaded files in the "uploads" folder
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads'); // Destination folder
    },
    filename: function (req, file, cb) {
        // Rename the uploaded file (you can use a unique name generator if needed)
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// display user page
router.get('/list', (req, res)=> {
    db.query('SELECT * FROM pa_users ORDER BY id asc',function(err,rows) {
        if(err) {
            res.status('err',err);   
        } else {
            const patientList = rows.map((user) => {
                const imageData = (user.img !==null) ? user.img.toString('base64') : user.img
                return { ...user, img: imageData };
            });
            res.status(200).send({
            message: "Data fetched successfully",
            data: patientList
            });
        }
    });
});



router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    // Query the database to get user details
    db.query('SELECT * FROM pa_users WHERE id = ?', [id], (error, userResults) => {
        if (error) {
            console.error('Error executing user query:', error);
            res.status(500).json({ error: 'Something went wrong' });
        } else if (userResults.length === 0) {
            res.status(404).json({ error: 'User not found' });
        } else {
            const user = userResults[0];
            
            // Construct the image path
            const imagePath = path.join(__dirname, '..', user.img);

            // Check if the file exists
            if (fs.existsSync(imagePath)) {
                // Create a response object with user details and image URL
                const response = {
                    user: user, // You can select specific fields from the user object if needed
//image_url: `/paUsers/${id}/image`, // Image URL
                };
                
                res.json(response);
            } else {
                res.status(404).json({ error: 'Image not found' });
            }
        }
    });
});


// Get a specific user on basis of Phone-No
router.post('/detail', (req, res) => {
    const { phone_no } = req.body;
    db.query('SELECT * FROM pa_users WHERE phone_no = ?', [phone_no], (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Something went wrong' });
        } else if (results.length === 0) {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.json(results[0]);
        }
    });
});

  
// Create a new user
router.post('/add', upload.single('image'), (req, res) => {
    const {
        f_name,
        l_name,
        phone_no,
        email,
        address,
        gender,
        
    } = req.body;
    
    let imgPath = ''; // Default empty image path
    
    if (req.file) {
        imgPath = req.file.path; // Use uploaded image if available
    } else {
        // Use a default image path if no image was uploaded
        imgPath = 'uploads/default.png'; // Update this with your default image filename
    }

    const user = {
        f_name,
        l_name,
        phone_no,
        email,
        address,
        gender,
        img: imgPath // Store the image path in the database
    };
    
    db.query('INSERT INTO pa_users SET ?', user, (error, result) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Something went wrong' });
        } else {
            res.status(201).json({ message: 'User created successfully', id: result.insertId, image: imgPath });
        }
    });
});


// // Update an existing user
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const {
        f_name,
        l_name,
        phone_no,
        email,
        gender,
        address,
        image,
        fcm_token
    } = req.body;
    
    // Create an object to store the fields that need to be updated
    const updateFields = {};

    // Check if each field exists in the request body and add it to the updateFields object
    if (f_name !== undefined) updateFields.f_name = f_name;
    if (l_name !== undefined) updateFields.l_name = l_name;
    if (phone_no !== undefined) updateFields.phone_no = phone_no;
    if (email !== undefined) updateFields.email = email;
    if (gender !== undefined) updateFields.gender = gender;
    if (address !== undefined) updateFields.address = address;
    if (fcm_token !== undefined) updateFields.fcm_token = fcm_token;
    if (image !== undefined) {
        const img = Buffer.from(image, 'base64');
        updateFields.img = img;
    }

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }
    
    db.query('UPDATE pa_users SET ? WHERE id = ?', [updateFields, id], (error, result) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Something went wrong' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.json({ message: 'User updated successfully' });
        }
    });
});


// Delete a user
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM pa_users WHERE id = ?', [id], (error, result) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Something went wrong' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.json({ message: 'User deleted successfully' });
        }
    });
});


module.exports = router;