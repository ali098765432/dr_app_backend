var express = require('express');
var router = express.Router();
var db  = require('../config/db');

// router.post('/add', (req, res) => {
//     const { dr_id, detail, week_date } = req.body;
  
//     const availabilityData = {
//       dr_id,
//       detail: JSON.stringify(detail),
//       week_date: new Date(week_date),
//     };
  
//     db.query('INSERT INTO availability SET ?', availabilityData, (error, result) => {
//         if (error) {
//             console.error('Error executing query:', error);
//             res.status(500).json({ error: 'Something went wrong' });
//         } else {
//             res.status(201).json({ message: 'Availability added successfully' });
//         }
//     });
// });

// New API
router.post('/add', (req, res) => {
  const { dr_id, date, to,from } = req.body;

  const availabilityData = {
    dr_id,    
    date: date,
    to: to,
    from: from,
  };
   
  db.query('INSERT INTO availability SET ?', availabilityData, (error, result) => {
      if (error) {
          console.error('Error executing query:', error);
          res.status(500).json({ error: 'Something went wrong' });
      } else {
          res.status(201).json({ message: 'Availability added successfully' });
      }
  });
});


// router.post('/dr/:id', (req, res) => {
//   const { id } = req.params;
//   const { date, day } = req.body;
   
//   let date_week = new Date(date);
//   var firstday =new Date(date_week.setDate(date_week.getDate() - date_week.getDay())).toISOString().split('T')[0];
//   var lastday = new Date(date_week.setDate(date_week.getDate() - date_week.getDay()+6)).toISOString().split('T')[0];
   
//   db.query('SELECT * FROM availability WHERE dr_id=? AND date BETWEEN ? AND ?', [id, firstday, lastday], (error, results) => {
//     if (error) {
//       console.error(error);
//       res.status(500).json({ error: 'An error occurred while fetching data.' });
//     } else {
       
//       const options = { weekday: 'long' }; // Specify the format as 'long' for the full day name
       
//       const groupedData = {};
//       results.forEach((item) => {
//         const itemDate = new Date(item.date);
//         const dayName = new Intl.DateTimeFormat('en-US', options).format(itemDate);
//         if (!groupedData[dayName]) {
//           groupedData[dayName] = [];
//         }
//         groupedData[dayName].push(item);
//       });

//       res.json(groupedData);
       
//     }
//   });
// });

router.post('/dr/:id', (req, res) => {
  const { id } = req.params;
  const { date, day } = req.body;

  let date_week = new Date(date);
  var firstday = new Date(date_week.setDate(date_week.getDate() - date_week.getDay())).toISOString().split('T')[0];
  var lastday = new Date(date_week.setDate(date_week.getDate() - date_week.getDay() + 6)).toISOString().split('T')[0];

  db.query(
    'SELECT *, DATE_FORMAT(date, "%W") AS day_name FROM availability WHERE dr_id=? AND date BETWEEN ? AND ?',
    [id, firstday, lastday],
    (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching data.' });
      } else {
        const groupedData = {};

        results.forEach((item) => {
          const dayName = item.day_name;
          if (!groupedData[dayName]) {
            groupedData[dayName] = [];
          }
          groupedData[dayName].push(item);
        });

        res.json(groupedData);
      }
    }
  );
});


// New API End


// Availability of Individual Doctor
// router.post('/dr/:id', (req, res) => {
//     const { id } = req.params;
//     const { week_date, day } = req.body;
  
//     db.query('SELECT * FROM availability WHERE dr_id = ? AND week_date = ?', [id, week_date], (error, results) => {
//       console.log(results);
//       if (error) {
//         console.error('Error executing query:', error);
//         res.status(500).json({ error: 'Something went wrong' });
//       } else if (results.length === 0) {
//         res.status(404).json({ error: 'Availability not found' });
//       } else {
//         const availability = results[0];
//         var detail = JSON.parse(availability.detail);
//         if (day !== null && day!== undefined){
//             // Filter the detail based on the provided date and day
//             detail = detail[day] ? detail[day] : {};
//         }
        
//         const response = {
//           id: availability.id,
//           dr_id: availability.dr_id,
//           detail: detail,
//           date: availability.date,
//         };
  
//         res.json(response);
//       }
//     });
// });


// Get Availability list of all Doctor
router.post('/list', (req, res) => {
    const { date } = req.body;
  
    db.query('SELECT * FROM availability WHERE date = ?', [date], (error, results) => {
      if (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Something went wrong' });
      } else if (results.length === 0) {
        res.status(404).json({ error: 'Availability not found' });
      } else {  
        res.json(results);
      }
    });
});



//Update Availability detail
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { dr_id, to,from, date} = req.body;
  
    db.query(
      'UPDATE availability SET `to` = ?, `from` = ?,date=? WHERE id = ?',
      [to, from,date, id],
      (error, result) => {
      if (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Something went wrong' });
      } else if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Availability record not found' });
      } else {
        res.json({ message: 'Availability updated successfully'});
      }
    });
});
  


module.exports = router;