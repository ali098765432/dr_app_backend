var express = require('express');
var router = express.Router();
var db  = require('../config/db');

//Add Visit
router.post('/add', (req, res) => {
    const { dr_id, pa_id, visit_no, charges, date_time, detail} = req.body;
    const start_date_time = new Date(date_time)
    const visits = {
      dr_id,
      pa_id,
      visit_no,
      charges,
      start_date_time,
      detail: JSON.stringify(detail),
    };
  
    db.query('INSERT INTO visits SET ?', visits, (error, result) => {
      if (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Something went wrong' });
      } else {
        const visitId = result.insertId; // Get the inserted visit_id
        res.status(201).json({ message: 'Visits record added successfully', visit_id: visitId });
      }
    });
});


// // Get Doctor Visits
// router.get('/dr/:id', (req, res) => {
//     const { id} = req.params;
//     const { pending, rejected, done } = req.query
//     var query = 'SELECT * FROM visits \
//                 LEFT JOIN dr_users ON dr_id = dr_users.id  \
//                 WHERE dr_id = ?'
//     if (pending!== null && pending!== undefined){
//       query += " AND is_pending= " + pending
//     }
//     if (rejected!== null && rejected!== undefined){
//       query += " AND is_rejected= " + rejected
//     }
//     if (done!== null && done!== undefined){
//       query += " AND is_done= " + done
//     }
//     db.query(query, [id], (error, results) => {
//         if (error) {
//             console.error('Error executing query:', error);
//             res.status(500).json({ error: 'Something went wrong' });
//         } else if (results.length === 0) {
//             res.status(404).json({ error: 'No record found' });
//         } else {
//             res.json(results);
//         }
//     });
// });

// Get Doctor Visits
router.get('/dr/:id', (req, res) => {
    const { id} = req.params;
    const { pending, rejected, done } = req.query
    var query = 'SELECT * FROM visits \
                LEFT JOIN pa_users ON pa_id = pa_users.id  \
                WHERE dr_id = ?'
    if (pending!== null && pending!== undefined){
      query += " AND is_pending= " + pending
    }
    if (rejected!== null && rejected!== undefined){
      query += " AND is_rejected= " + rejected
    }
    if (done!== null && done!== undefined){
      query += " AND is_done= " + done
    }
    db.query(query, [id], (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Something went wrong' });
        } else if (results.length === 0) {
            res.status(404).json({ error: 'No record found' });
        } else {
            res.json(results);
        }
    });
});


// Get Patient Visits
router.get('/pa/:id', (req, res) => {
    const { id } = req.params;
    const { pending, rejected, done } = req.query
    var query = 'SELECT * FROM visits \
                LEFT JOIN pa_users ON pa_id = pa_users.id  \
                WHERE pa_id = ?'
    if (pending!== null && pending!== undefined){
      query += " AND is_pending= " + pending
    }
    if (rejected!== null && rejected!== undefined){
      query += " AND is_rejected= " + rejected
    }
    if (done!== null && done!== undefined){
      query += " AND is_done= " + done
    }
    db.query(query, [id], (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Something went wrong' });
        } else if (results.length === 0) {
            res.status(404).json({ error: 'No record found' });
        } else {
            res.json(results);
        }
    });
});


//Update Visit detail
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
      dr_id,
      pa_id,
      visit_no,
      charges,
      date_time,
      detail,
      is_pending,
      is_done,
      is_rejected,
      is_accepted
  } = req.body;

  // Create an object to store the fields that need to be updated
  const updateFields = {};

  // Check if each field exists in the request body and add it to the updateFields object
  if (dr_id !== undefined) updateFields.dr_id = dr_id;
  if (pa_id !== undefined) updateFields.pa_id = pa_id;
  if (visit_no !== undefined) updateFields.visit_no = visit_no;
  if (charges !== undefined) updateFields.charges = charges;
  if (date_time !== undefined) updateFields.date_time = new Date(date_time);
  if (detail !== undefined) updateFields.detail = detail;
  if (is_pending !== undefined) updateFields.is_pending = is_pending;
  if (is_done !== undefined) updateFields.is_done = is_done;
  if (is_rejected !== undefined) updateFields.is_rejected = is_rejected;
  if (is_accepted !== undefined) updateFields.is_accepted = is_accepted;
  if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
  }

  db.query('UPDATE visits SET ? WHERE visit_id = ?', [updateFields, id], (error, result) => {
      if (error) {
          console.error('Error executing query:', error);
          res.status(500).json({ error: 'Something went wrong' });
      } else if (result.affectedRows === 0) {
          res.status(404).json({ error: 'Visit not found' });
      } else {
          res.json({ message: 'Visit updated successfully' });
      }
  });
});

  
module.exports = router