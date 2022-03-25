<?php

// if (isset($_FILES['file']['name'])) {
   // File name
   $filename = $_FILES['file']['name'];
   echo $filename;
   exit;

   // Location
   $location = '../assets/videos/' . $filename;

   // File extension
   $file_extension = pathinfo($location, PATHINFO_EXTENSION);
   $file_extension = strtolower($file_extension);

   // Valid extensions
   $valid_ext = array("mp4", "webm", "ogg");

   $response = "false";
   if (in_array($file_extension, $valid_ext)) {
      // Check if already exists
      if (file_exists($location)) {
         echo "existe";
         exit;
      }

      // Upload file
      if (move_uploaded_file($_FILES['file']['tmp_name'], $location)) {
         $response = $location;
      }
   }

   echo $response;
   exit;
// }
