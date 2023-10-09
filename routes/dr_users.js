var express = require('express');
var router = express.Router();
var db  = require('../config/db');
router.use(express.json({ limit: '10mb' })); // Adjust the limit based on your image size requirements

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


// Fetch popular doctors based on reviews and ratings
router.get('/popular_doctors/list', (req, res) => {
    const popularDoctorsQuery = `
      SELECT dr_users.*, COUNT(rating_reviews.id) AS review_count, AVG(rating_reviews.rating) AS avg_rating
      FROM dr_users
      LEFT JOIN rating_reviews ON dr_users.id = rating_reviews.dr_id
      GROUP BY dr_users.id
      HAVING review_count >= 10 AND avg_rating >= 4.0
      ORDER BY review_count DESC, avg_rating DESC
      LIMIT 10;
    `;
  
    db.query(popularDoctorsQuery, (error, rows) => {
      if (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Something went wrong' });
      } else {
            const popularDoctors = rows.map((user) => {
              const imageData = (user.img !==null) ? user.img.toString('base64') : user.img
              return { ...user, img: imageData };
            });
            res.status(200).send({
            message: "Data fetched successfully",
            data: popularDoctors
            });
        }
    });
});


// Get list of all doctors
router.post('/list', (req, res)=> {
    const { search } = req.body;
    var query = `SELECT dr.*, COUNT(rating_reviews.id) AS review_count, AVG(rating_reviews.rating) AS avg_rating
                FROM dr_users dr
                LEFT JOIN rating_reviews ON dr.id = rating_reviews.dr_id
                `
    var where = "";
    if (search !== null && search !== undefined){
        where = ` WHERE dr.f_name LIKE ('%${search}%')`;
        where += ` OR dr.l_name LIKE ('%${search}%')`;
        where += ` OR dr.address LIKE ('%${search}%')`;
        where += ` OR dr.profession LIKE ('%${search}%')`;
        where += ` OR dr.hospital LIKE ('%${search}%')`;
    }          
    
    query =  query + where + ' GROUP BY dr.id  ORDER BY review_count DESC, avg_rating DESC'
    db.query(query, function(err,rows) {
        if(err) {
            res.status('err',err);   
        } else {
            const drUsersList = rows.map((user) => {
              const imageData = (user.img !==null) ? user.img.toString('base64') : user.img
              return { ...user, img: imageData };
            });
            res.status(200).send({
            message: "Data fetched successfully",
            data: drUsersList
            });
        }
    });
});


// Get a specific user
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // Query the database to get user details
  db.query('SELECT * FROM dr_users WHERE id = ?', [id], (error, drResults) => {
      if (error) {
          console.error('Error executing user query:', error);
          res.status(500).json({ error: 'Something went wrong' });
      } else if (drResults.length === 0) {
          res.status(404).json({ error: 'User not found' });
      } else {
          const dr = drResults[0];
          
          // Construct the image path
          const imagePath = path.join(__dirname, '..', dr.img);

          // Check if the file exists
          if (fs.existsSync(imagePath)) {
              // Create a response object with user details and image URL
              const response = {
                  doctor: dr, // You can select specific fields from the user object if needed
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
router.post('/auth', (req, res) => {
    const { phone_no } = req.body;
    db.query('SELECT * FROM dr_users WHERE phone_no = ?', [phone_no], (error, results) => {
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
router.post('/add',  upload.single('image'),(req, res) => {
    const {
        f_name,
        l_name,
        phone_no,
        email,
        branches,
        gender,
        profession,
        hospital,
        experience,
        fee
        
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
        gender,
        profession,
        hospital,
        experience,
        fee,
        img: imgPath // Store the image path in the database

    };
    
    db.query('INSERT INTO dr_users SET ?', user, (error, result) => {
      if (error) {
          console.error('Error executing query:', error);
          res.status(500).json({ error: 'Something went wrong' });
      } else {
        const drId = result.insertId; // Get the generated dr_id

        // Insert branches into the branches table
        const insertBranchQuery = 'INSERT INTO dr_branches (dr_id, name, address, lat, lng) VALUES (?, ?, ?, ?, ?)';

        const branchInsertPromises = Object.values(branches).map((branch) => {
          return new Promise((resolve, reject) => {
            db.query(insertBranchQuery, [drId, branch.name, branch.address, branch.lat, branch.lng], (branchInsertError, branchResult) => {
              if (branchInsertError) {
                reject(branchInsertError);
              } else {
                resolve(branchResult);
              }
            });
          });
        });

        Promise.all(branchInsertPromises)
          .then(() => {
            res.status(201).json({ message: 'Doctor and branches added successfully.', id: result.insertId  });
          })
          .catch((branchInsertError) => {
            console.error('Error inserting branches:', branchInsertError);
            res.status(200).json({ message: 'Doctor Added Successfully, In Branches Something went wrong', id: result.insertId  });
          });
      }
  });
});


// Update an existing user
// router.put('/:id', (req, res) => {
//     const { id } = req.params;
//     const {
//         f_name,
//         l_name,
//         phone_no,
//         email,
//         address,
//         lat,
//         lng,
//         gender,
//         profession,
//         hospital,
//         experience,
//         fee,
//         image,
//         fcm_token
//     } = req.body;
//     // Convert the base64 image data to a buffer
//     const img = Buffer.from(image, 'base64');
    
//     const user = {
//         f_name,
//         l_name,
//         phone_no,
//         email,
//         address,
//         lat,
//         lng,
//         gender,
//         profession,
//         hospital,
//         experience,
//         fee,
//         img,
//         fcm_token
//     };
    
//     db.query('UPDATE dr_users SET fcm_token= ? WHERE id = ?', [user, id], (error, result) => {
//         if (error) {
//             console.error('Error executing query:', error);
//             res.status(500).json({ error: 'Something went wrong' });
//         } else if (result.affectedRows === 0) {
//             res.status(404).json({ error: 'User not found' });
//         } else {
//             res.json({ message: 'User updated successfully' });
//         }
//     });
// });
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updateFields = req.body; // Fields to be updated

  // Check if there are any fields to update
  if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
  }

  // Construct the SET clause dynamically based on the updateFields
  const setClause = [];
  const values = [];

  for (const field in updateFields) {
      setClause.push(`${field} = ?`);
      values.push(updateFields[field]);
  }

  // Add the user ID to the values array for the WHERE clause
  values.push(id);

  const updateQuery = `UPDATE dr_users SET ${setClause.join(', ')} WHERE id = ?`;

  db.query(updateQuery, values, (error, result) => {
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
    db.query('DELETE FROM dr_users WHERE id = ?', [id], (error, result) => {
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


// Fetch doctor details from dr_users table
router.get('/detail/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM dr_users WHERE id = ?', [id], (error, drResults) => {
      if (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Something went wrong' });
      } else if (drResults.length === 0) {
        res.status(404).json({ error: 'Doctor not found' });
      } else {
        var doctor = drResults[0];
        doctor.img = (doctor.img !==null) ? doctor.img.toString('base64') : doctor.img // Convert the image buffer to a base64 string
  
        // Fetch count of rating reviews and average rating from rating_reviews table
        db.query('SELECT COUNT(*) AS review_count, AVG(rating) AS avg_rating FROM rating_reviews WHERE dr_id = ?', [id], (error, ratingResults) => {
          if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Something went wrong' });
          } else {
            doctor.review_count = ratingResults[0].review_count;
            doctor.avg_rating = ratingResults[0].avg_rating || 0;
  
            // Fetch sum of earnings from earnings table
            db.query('SELECT SUM(charges) AS total_earning FROM earnings WHERE dr_id = ?', [id], (error, earningResults) => {
              if (error) {
                console.error('Error executing query:', error);
                res.status(500).json({ error: 'Something went wrong' });
              } else {
                doctor.total_earning = earningResults[0].total_earning || 0;
  
                // Fetch upcoming visits from visits table with day and time greater than current date and time
                const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Convert to MySQL datetime format
                console.log("currentDate1", currentDate)
                db.query('SELECT * FROM visits WHERE dr_id = ? AND is_done = 0 AND is_rejected = 0 AND start_date_time > ?', [id, currentDate], (error, visitResults) => {
                  if (error) {
                    console.error('Error executing query:', error);
                    res.status(500).json({ error: 'Something went wrong' });
                  } else {
                    doctor.upcoming_visits = visitResults;
  
                    res.json(doctor);
                  }
                });
              }
            });
          }
        });
      }
    });
});


router.get('/profession/list', (req, res) => {
    const query = 'SELECT DISTINCT profession FROM dr_users';
  
    db.query(query, (error, results) => {
      if (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Something went wrong' });
      } else {
        const doctorsByProfession = {};
  
        // Fetch data for each unique profession type
        results.forEach((result) => {
          const profession = result.profession;
          const professionQuery = 'SELECT * FROM dr_users WHERE profession = ?';
  
          db.query(professionQuery, [profession], (error, professionResults) => {
            if (error) {
              console.error('Error executing query:', error);
              res.status(500).json({ error: 'Something went wrong' });
            } else {
              doctorsByProfession[profession] = professionResults;
  
              // Check if all unique profession types have been fetched
              if (Object.keys(doctorsByProfession).length === results.length) {
                res.json(doctorsByProfession);
              }
            }
          });
        });
      }
    });
});
  

module.exports = router;