-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 21, 2026 at 03:39 AM
-- Server version: 10.6.25-MariaDB
-- PHP Version: 8.4.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `haminepa_eatnchill_wp227`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_login`
--

CREATE TABLE `admin_login` (
  `aid` int(11) NOT NULL,
  `username` varchar(30) NOT NULL,
  `password` varchar(50) NOT NULL,
  `account_type` varchar(30) NOT NULL,
  `encrypt_type` varchar(5) NOT NULL,
  `mins` int(11) NOT NULL DEFAULT 0,
  `secs` int(11) NOT NULL DEFAULT 0
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `admin_login`
--

INSERT INTO `admin_login` (`aid`, `username`, `password`, `account_type`, `encrypt_type`, `mins`, `secs`) VALUES
(215, 'eatnchill', 'Nepal@123', 'admin', 'TXT', 0, 11);

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `categoryid` int(11) NOT NULL,
  `catname` varchar(30) NOT NULL,
  `priority` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`categoryid`, `catname`, `priority`) VALUES
(34, 'All day Lunch', 9),
(36, 'Burgers', 10),
(37, 'Juices', 6),
(38, 'Smoothies', 5),
(39, 'Coffee', 1),
(40, 'Cold drinks', 7),
(41, 'Kids drinks', 4),
(42, 'Kids menu', 12),
(44, 'Tea', 2),
(52, 'Add-On', 13),
(54, 'Hot Drinks', 3),
(55, 'All day breakfast', 8),
(56, 'Bites', 11);

-- --------------------------------------------------------

--
-- Table structure for table `guest`
--

CREATE TABLE `guest` (
  `gid` int(11) NOT NULL,
  `guest_code` varchar(30) DEFAULT NULL,
  `reserve_for` int(11) DEFAULT NULL,
  `table_no` int(11) DEFAULT NULL,
  `cdate` varchar(30) DEFAULT NULL,
  `ctime` varchar(30) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mailing`
--

CREATE TABLE `mailing` (
  `host` varchar(30) DEFAULT NULL,
  `user_name` varchar(30) DEFAULT NULL,
  `pass_word` varchar(30) DEFAULT NULL,
  `setFrom` varchar(30) DEFAULT NULL,
  `addAddress` varchar(30) DEFAULT NULL,
  `status` varchar(5) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `mailing`
--

INSERT INTO `mailing` (`host`, `user_name`, `pass_word`, `setFrom`, `addAddress`, `status`) VALUES
('mail.eatnchill.com.au', 'info@eatnchill.com.au', 'v32ZcTm4ypvANUj', 'info@eatnchill.com.au', 'menu@eatnchill.com.au', 'ON');

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `productid` int(11) NOT NULL,
  `categoryid` int(11) NOT NULL,
  `productname` varchar(80) NOT NULL,
  `description` longtext DEFAULT NULL,
  `note` varchar(150) NOT NULL,
  `price` float NOT NULL,
  `old_price` float DEFAULT NULL,
  `photo` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`productid`, `categoryid`, `productname`, `description`, `note`, `price`, `old_price`, `photo`) VALUES
(183, 55, 'Saksuka (GFO)', 'Housemade Rich Napoli sauce with Smokey Chorizo, SautÃ©ed Mushroom, Chunky Tomato, Spanish onion, Free Range Poached eggs, and Crumbled Feta with Organic Sourdough. ', '', 24, NULL, 'IMG_2235_1696560081.jpeg'),
(184, 34, 'Nourish Bowl (GF, V, DF)', 'Roasted Pumpkin, Cauliflower, Red Capsicum, Broccoli, Kale, Roasted Chickpeas topped with Poached egg served with Tahini  ', '', 23, NULL, 'IMG_2283_1696576040.jpeg'),
(185, 34, 'Green Bowl (GF, DF, V, VGO)', 'Quinoa, Kale, Broccoli, Zucchini, Green string beans cooked with Dairy Free Pesto served with Poached egg ', '', 23, NULL, 'IMG_2239_1696558863.jpeg'),
(186, 34, 'Miso Trout Bowl (GF,DF)', 'Smoked Trout, Avocado, Steamed Kale, Brown Rice served with Housemade Miso Dressing', '', 31, NULL, 'IMG_2240_1696558994.jpeg'),
(188, 34, 'Rainbow Chicken Salad (GF, DF)', 'Shredded Poached Chicken with Slaw, Roasted Almond, Seeds served with Miso Dressing', '', 21, NULL, 'IMG_1213_1696929819.jpeg'),
(190, 34, 'Chilli Chicken Fried Rice (GF, DF, VO)', 'Brown Rice, Chicken, Chili, Tamari, Ginger, Egg ', '', 22, NULL, 'IMG_2236_1696558791.jpeg'),
(191, 36, 'Wagyu Royale', 'Wagyu Beef Pattie, Onion Jam, Tomato, Spinach, American Cheese & ENC truffle Sauce served with Chips & Aioli', '', 24, NULL, 'IMG_2343_1696642171.jpeg'),
(192, 36, 'The Tender Grill', 'Grilled Chicken, Coleslaw, Free Range Bacon, Fresh Tomato & Onion Jam with Chips', '', 24, NULL, 'IMG_2348_1696641992.jpeg'),
(193, 36, 'Inferno Chicken', 'Peri Peri Chicken, Spinach, American Cheese, Fresh Tomato & Onion jam served with Chips & Homemade Perinaise', '', 23, NULL, 'IMG_2588_1696734933.jpeg'),
(194, 36, 'Crispy Southern Charm', '12 Spice Fried Chicken served with Coleslaw, American Cheese & Homemade Spicy Sauce with Chips', '', 23, NULL, 'IMG_2344_1696641319.jpeg'),
(195, 37, 'Ultimate Energiser', 'Orange, Apple, Watermelon', '', 10, NULL, 'IMG_2339_1696632157.jpeg'),
(196, 37, 'Green Love', 'Apple, Cucumber, Celery, Broccoli', '', 10, NULL, 'IMG_2346_1696641509.jpeg'),
(197, 37, 'Super Immune Support', 'Celery, Turmeric, Ginger, Apple, Orange, Lemon', '', 10, NULL, 'IMG_2509_1696720568.jpeg'),
(198, 37, 'Blood Purifier', 'Beetroot, Celery, Carrot, Cucumber, Lemon, Ginger', '', 10, NULL, 'IMG_2351_1696642378.jpeg'),
(200, 37, 'Orange Sunrise', 'Orange, Carrot & Ginger', '', 10, NULL, 'IMG_2320_1696627586.jpeg'),
(201, 38, 'Classic Smoothie(DFO)', 'Choice of Banana, Mix Berries or Mango with Milk and Honey', '', 11, NULL, 'IMG_2621_1696806477.jpeg'),
(202, 38, 'Salted Peanut Butter(DF)', 'Oats, Salted Caramel, Peanut Butter, Chocolate Oat Milk', '', 11, NULL, 'IMG_2468_1696720270.jpeg'),
(203, 38, 'Morning Boost(DF)', 'Banana, Oats, Cinnamon, Honey, Almond Milk', '', 11, NULL, 'IMG_2479_1696720519.jpeg'),
(204, 38, 'Green Energy (DF, GF)', 'Apple, Banana, Vegan Green Powder, Almond Milk', '', 11, NULL, 'IMG_2341_1696640359.jpeg'),
(205, 38, 'Choc Bliss (DF, GF)', 'Cacao, Chia seeds, Banana, Almond Milk', '', 11, NULL, 'IMG_2617_1696806457.jpeg'),
(206, 38, 'Reboot Smoothie (DF, GF)', 'Banana, Mango, Chia Seeds, Honey, Coconut Water', '', 11, NULL, 'IMG_2628_1696820833.jpeg'),
(207, 38, 'Berry Bliss (GF)', 'Apple, Mixed Berries, Ice cream ', '', 11, NULL, 'IMG_2627_1696820792.jpeg'),
(210, 44, 'Tea', 'English Breakfast\r\nGreen Tea\r\nLemongrass & Ginger\r\nEarl Grey\r\nChamomile\r\nPeppermint\r\nRoobios\r\nDandelion', '', 4.5, NULL, 'IMG_2636_1696881008.jpeg'),
(212, 54, 'Brew Chai Latte', 'Organic Chai Tea sweetened with Spices & Honey', '', 5.5, NULL, 'IMG_2368_1696648390.jpeg'),
(213, 54, 'Hot Chocolate', 'Cacao & Rapadura Sugar', '', 4.5, NULL, 'IMG_2373_1696649920.jpeg'),
(215, 54, 'Matcha Latte', 'Fine Organic Green Tea Powder no added sugar', '', 5.5, NULL, 'IMG_2559_1696732216.jpeg'),
(216, 40, 'Iced Chai', 'Organic Sticky Chai Tea sweetened with Spices & Honey', '', 7, NULL, 'IMG_2470_1696720482.jpeg'),
(217, 40, 'Vietnamese Iced Coffee', 'Double shot The Little Marionette coffee sweetened Condensed Milk ', '', 7, NULL, 'IMG_2356_1696643856.jpeg'),
(218, 40, 'Iced Coffee', 'Double shot Espresso with Vanilla syrup & Icecream', '', 8.5, NULL, 'IMG_2433_1696715838.jpeg'),
(220, 40, 'Classic Milkshakes', 'Chocolate, Vanilla, Strawberry, Banana, Caramel', '', 9, NULL, 'IMG_2332_1696630467.jpeg'),
(221, 42, 'Kid\'s Pancake (GF)', 'Served with Banana & Maple Syrup \r\n', '', 10, NULL, 'SampleImage_1694072938.png'),
(222, 42, 'Brekkie Box', 'Ham & Cheese Toastie served with Fresh Orange or Apple Juice, Lollipop\r\n\r\n', '', 14, NULL, 'SampleImage_1694072996.png'),
(223, 42, 'Lunch Box', 'Cheese Toastie, Fresh Orange or Apple Juice, Lollipop', '', 13, NULL, 'SampleImage_1694073032.png'),
(225, 42, 'Kid\'s Cheeseburger', 'Waygu Beef Pattie, American Cheese with Tomato sauce served with Chips & Tomato Sauce\r\n', '', 16, NULL, 'SampleImage_1694073111.png'),
(227, 41, 'Kid\'s Juice', 'Choice of Orange, Apple or Watermelon', '', 6, NULL, 'IMG_2593_1696734745.jpeg'),
(229, 41, 'Kid\'s Milkshakes', 'Choice of Chocolate, Vanilla, Strawberry, Caramel, Banana', '', 6, NULL, 'IMG_2592_1696734793.jpeg'),
(231, 55, 'Feta Kissed Avo (V, GFO)', '2 Poached Eggs, Smashed Avocado, Crumbled Feta, Cherry tomato, Housemade Beetroot Hummus drizzled with Balsamic Glaze & Dukkah on Organic Sourdough ', '', 23, NULL, 'IMG_2244_1696559909.jpeg'),
(232, 55, 'Halloumi Stack (V)', 'Smashed Avo on Organic Sourdough with 2 Fried Eggs. Grilled Halloumi, Hash Brown & Housemade Dairy Free Pesto ', '', 23, NULL, 'IMG_2234_1696560299.jpeg'),
(233, 55, 'Corn Fritters (VO)', 'Crispy Corn Fritters served with Smashed Avocado, Free Range Bacon, Housemade Beetroot hummus, Tomato Relish, Poached Egg & drizzled with Balsamic Glaze ', '', 23, NULL, 'IMG_2248_1696560219.jpeg'),
(235, 55, 'Naked Breakfast (V, GFO)', '2 Poached eggs, Grilled Haloumi, SautÃ©ed Mushroom, Housemade Dairy Free Pesto Tomato Avocado Salsa, Fresh Spinach served with Organic Sourdough ', '', 24, NULL, 'IMG_2249_1696560402.jpeg'),
(237, 55, 'Brekkie Burger (VO)', 'Stanny side up egg, Free Range Bacon, Tomato Relish, Spinach, Hash Brown & Homemade Aloli\r\n', '', 18, NULL, 'IMG_2469_1696720346.jpeg'),
(238, 55, 'The Benny Classic', '2 Poached eggs, Spinach, Hollandaise sauce on Sourdough with choice of Bacon/Smoked salmon', '', 23, NULL, 'IMG_2587_1696735039.jpeg'),
(239, 55, 'Wholesome Buckwheat Pancakes (V, GF)', 'Double Stack Buckwheat Pancake topped with blueberry compote, Banana & Canadian Maple Syrup', '', 21, NULL, 'IMG_6351_1749093464.jpeg'),
(240, 55, 'The Ultimate Feast', 'Choice of Eggs, Free Range Bacon, Chorizo, Steamed Spinach Sauteed Mushroom, Roasted tomato, Hash Brown with Sourdough', '', 29, NULL, 'IMG_2245_1696559984.jpeg'),
(241, 55, 'The Veggie Feast', 'Choice of Eggs, Grilled Halloumi, Avocado, Spinach, Mushroom. Roasted Tomato, Hash Brown with Sourdough', '', 28, NULL, 'IMG_2246_1696560442.jpeg'),
(242, 55, 'The Personalized Eggs (V, DF)', 'Poached, Scrambled (DF), Sunny side up Eggs with Organic Sourdough', '', 13.5, NULL, 'IMG_2643_1696886256.jpeg'),
(265, 39, 'Mocha', 'Extra Option Available', 'DefaultNote', 4.5, NULL, 'IMG_2276_1696573642.jpeg'),
(347, 40, 'Iced Long Black', 'Iced Long Black', 'DefaultNote', 6, NULL, 'IMG_2358_1696645120.jpeg'),
(348, 40, 'Iced Milo', 'Iced Chocolate', 'DefaultNote', 8.5, NULL, 'IMG_0673_1749093202.jpeg'),
(379, 39, 'Flat white', 'Extra option available', 'DefaultNote', 4, NULL, 'IMG_2709_1697252477.jpeg'),
(380, 39, 'Cappuccino', 'Extra Option Available', 'DefaultNote', 4, NULL, 'IMG_2591_1696734858.jpeg'),
(381, 39, 'Latte', 'Extra Option Available', 'DefaultNote', 4, NULL, 'IMG_2527_1696727240.jpeg'),
(382, 39, 'Piccolo', 'Extra Option available', 'DefaultNote', 4, NULL, 'IMG_2277_1696727300.jpeg'),
(383, 39, 'Macchiato', 'Extra Option Available', 'DefaultNote', 4, NULL, 'IMG_2704_1697251814.jpeg'),
(384, 39, 'Long Black', 'Extra Option Available', 'DefaultNote', 4, NULL, 'IMG_2279_1696574571.jpeg'),
(385, 39, 'Expresso', 'Extra Option Available', 'DefaultNote', 4, NULL, 'IMG_2274_1696573094.jpeg'),
(386, 42, 'Cheese Toastie', 'Kid\'s Bread with Tasty Chesse', 'DefaultNote', 7, NULL, ''),
(387, 42, 'Ham Cheese Toastie', 'Kid\'s Bread with Ham & Tasty Chesse', 'DefaultNote', 8.5, NULL, ''),
(388, 42, 'Kid\'s Scrambled Egg on Toast', 'Kid\'s Bread served with Dairy Free Scrambled Egg', 'DefaultNote', 7.5, NULL, ''),
(389, 42, 'Kid\'s Smashed Avo on Toast', 'Kid\'s Bread with Smashed Avo', 'DefaultNote', 7.5, NULL, ''),
(390, 42, '6 Chicken Nuggets & Chips', '6 Chicken Nuggets & Chips served with tomato sauce', 'DefaultNote', 12, NULL, ''),
(391, 42, 'Kid\'s Bacon n Egg Bun (with Tomato sauce)', 'Kid\'s Bacon n Egg Bun served with Tomato sauce\r\n', 'DefaultNote', 10, NULL, ''),
(392, 41, 'Babyccino(with marshmallow)', 'Babyccino (with marshmallow)', 'DefaultNote', 2, NULL, 'IMG_2328_1696628411.jpeg'),
(396, 40, 'Iced Latte', 'Iced Latte', 'DefaultNote', 6, NULL, 'IMG_2405_1696712722.jpeg'),
(399, 52, 'Sourdough', 'Add-On:Sourdough', 'DefaultNote', 3, NULL, ''),
(400, 52, 'GFO', 'GFO(Add-On)', 'DefaultNote', 2, NULL, ''),
(401, 52, 'Free Range Bacon', 'FreeRangeBacon', 'DefaultNote', 5.5, NULL, ''),
(402, 52, 'Egg', 'Egg', 'DefaultNote', 4, NULL, ''),
(403, 52, 'Chorizo', 'Chorizo', 'DefaultNote', 5.5, NULL, ''),
(404, 52, 'Avocado', 'Avocado', 'DefaultNote', 4, NULL, ''),
(405, 52, 'Falafel', 'Falafel', 'DefaultNote', 5, NULL, ''),
(406, 52, 'Grilled Haloumi', 'Grilled Haloumi', 'DefaultNote', 5, NULL, ''),
(407, 52, 'Spinach', 'Spinach', 'DefaultNote', 4, NULL, ''),
(408, 52, 'Roasted Tomato', 'Roasted Tomato', 'DefaultNote', 4, NULL, ''),
(409, 52, 'Hash brown', 'Hash brown', 'DefaultNote', 3.5, NULL, ''),
(410, 52, 'Sauteed Mushrooms', 'SautÃ©ed Mushrooms', 'DefaultNote', 4.5, NULL, ''),
(411, 37, 'Make Your Own Juice', 'MAXIMUM 4 CHOICES \r\nADD Any Ingredient $1 Extra\r\n\r\n', 'DefaultNote', 10, NULL, 'IMG_2264_1696571331.jpeg'),
(413, 41, 'Kid\'s Smoothie', 'Choice of Mango, Banana or Mix Berries', 'DefaultNote', 6.5, NULL, 'IMG_2622_1696806532.jpeg'),
(414, 54, 'Turmeric Latte', 'A blend of Turmeric, Honey, Coconut Milk', 'DefaultNote', 5.5, NULL, 'IMG_2366_1696647871.jpeg'),
(416, 56, 'Bowl of Chips with Tomato Sauce', 'Bowl of Chips with Tomato Sauce', 'DefaultNote', 8.5, NULL, 'IMG_2552_1696731034.jpeg'),
(427, 62, 'Miso Trout Bowl', 'Smoked Trout, Avocado, Steamed Kale, Brown Rice served with Housemade Miso dressing', 'DefaultNote', 27, NULL, 'IMG_2240_1696570952.jpeg'),
(428, 62, 'Nourish Bowl', 'Roasted Pumpkin, Cauliflower, Red Capsicum, Broccoli, Kale, Roasted Chickpeas topped with Poached egg\r\nserved with Tahini \r\n', 'DefaultNote', 22, NULL, 'IMG_2283_1696576062.jpeg'),
(429, 0, 'Green Bowl', 'Quinoa, Kale, Broccoli, Zucchini, Green string beans cooked with Dairy Free Pesto served with Poached egg\r\n\r\n', 'DefaultNote', 23, NULL, 'IMG_2239_1696571029.jpeg'),
(430, 62, 'Chili Chicken Fried Rice', 'Brown Rice, Chicken, Chili, Tamari, Ginger, Egg', 'DefaultNote', 21, NULL, 'IMG_2236_1696571048.jpeg'),
(431, 62, 'Wagyu Beef Burger', 'Wagyu Beef Pattie, Caramelised Onions, Tomato, Spinach & American Cheese, BBQ Sauce with chips', 'DefaultNote', 23, NULL, 'IMG_2343_1696642277.jpeg'),
(432, 62, 'Grilled Chicken Burger', 'Grilled Chicken, Coleslaw, Smashed Avocado, Fresh Tomato & Onion with Chips', 'DefaultNote', 22, NULL, 'IMG_2348_1696642029.jpeg'),
(436, 62, 'Southern Fried Chicken Burger', '12 Spice Fried Chicken served with Coleslaw, American Cheese & Homemade Spicy Sauce with Chips\r\n', 'DefaultNote', 22, NULL, 'IMG_2344_1696642085.jpeg'),
(439, 44, 'Kangen Ukon Tea', 'Organic Turmeric Tea From Okinawa Japan', 'DefaultNote', 5, NULL, 'IMG_2635_1739587025.jpeg'),
(448, 55, 'Golden Truffle Brunch', 'Crispy Hash Brown served with Sautted Spinach and Mushrooms with Truffle Sauce, and topped with 2 Poached Eggs on Organic Sourdough', 'DefaultNote', 25, NULL, ''),
(451, 42, 'Croissant ', 'Fresh croissant', 'DefaultNote', 4.9, NULL, ''),
(452, 42, 'Cheese croissant ', 'Toasted with tasty cheese', 'DefaultNote', 8, NULL, ''),
(454, 40, 'Matcha Coco', '100% Matcha with Coconut water', 'DefaultNote', 8.5, NULL, ''),
(456, 54, 'Milo latte', 'With whipped cream', 'DefaultNote', 6, NULL, ''),
(457, 54, 'Biscoff latte', 'With coffee ', 'DefaultNote', 6, NULL, ''),
(458, 37, 'Sunshine Refresher', 'Orange, Watermelon, Passion fruit', 'DefaultNote', 10, NULL, ''),
(459, 38, 'Pineapple Smoothie', 'Banana, Pineapple, Honey, coconut milk', 'DefaultNote', 11, NULL, ''),
(460, 38, 'Hawaiian Smoothie', 'Pineapple, Mango, Orange, Passion Fruit', 'DefaultNote', 11, NULL, ''),
(461, 40, 'Iced Matcha', '100% Matcha with Milk , sweet or unsweetened', 'DefaultNote', 0, NULL, '');

-- --------------------------------------------------------

--
-- Table structure for table `product_option`
--

CREATE TABLE `product_option` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `choice` varchar(255) NOT NULL,
  `price` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `product_option`
--

INSERT INTO `product_option` (`id`, `product_id`, `choice`, `price`) VALUES
(1, 362, 'Hello', 1),
(2, 363, 'Hello', 2),
(3, 364, 'Hello', 1),
(4, 364, 'Helloa', 2),
(5, 364, 'Hellodsd', 5),
(6, 365, 'Hello', 1),
(7, 366, 'Berry Bliss', 6),
(8, 366, 'Berry Bliss (ADD any Extra)', 7),
(9, 367, 'A', 1),
(10, 367, 'B', 1),
(18, 368, 'another 2', 15),
(21, 370, '1', 5),
(23, 369, 'Extra Short', 0),
(24, 371, '2', 2),
(25, 371, '3', 3),
(26, 371, '4', 4),
(27, 371, '5', 5),
(28, 371, '6', 6),
(46, 372, 'Syrup (vanilla, caramel, hazelnut)', 0),
(47, 373, 'Decaf', 0),
(48, 373, 'Extra Shot', 0),
(49, 373, 'Lactose Free Milk Lab', 0),
(50, 373, 'Coconut Milk Lab', 0),
(51, 373, 'Syrup (vanilla, caramel, hazelnut)', 0),
(52, 374, 'ano', 4.5),
(53, 375, 'hello', 0.5),
(54, 376, 'option 1', 0.5),
(55, 376, 'option 2', 0.6),
(56, 376, 'option 3', 0.7),
(75, 377, 'Decaf', 0.5),
(83, 378, 'Coconut Milk Lab', 0.5),
(186, 330, 'ADD any ingredient $2 Extra', 2),
(187, 330, 'Vegan Protein Powder $2', 2),
(208, 182, 'Make Your Own Juice(Maximum 4 choice)', 10),
(209, 182, 'ADD any ingredient $1 Extra', 1),
(210, 182, 'No ice $1 Extra', 1),
(358, 226, 'Decaf', 0.5),
(359, 226, 'Extra Shot', 0.5),
(360, 226, 'Lactose Free milk lab', 0.5),
(361, 226, 'Coconut Milk Lab', 0.5),
(362, 226, 'Vanilla Syrup', 0.5),
(363, 226, 'Caramel Syrup', 0.5),
(364, 226, 'Hazelnut Syrup', 0.5),
(365, 226, 'Bonsoy', 0.5),
(366, 226, 'Almond Milk Lab', 0.5),
(367, 226, 'Califia Oat', 0.5),
(368, 226, 'Macadamia Milk Lab', 0.5),
(369, 397, 'Decaf', 0.5),
(370, 397, 'Extra Shot', 0.5),
(371, 397, 'Lactose Free milk lab', 0.5),
(372, 397, 'Coconut Milk Lab', 0.5),
(373, 397, 'Vanilla Syrup', 0.5),
(374, 397, 'Caramel Syrup', 0.5),
(375, 397, 'Hazelnut Syrup', 0.5),
(376, 397, 'Bonsoy', 0.5),
(377, 397, 'Almond Milk Lab', 0.5),
(378, 397, 'Califia Oat', 0.5),
(379, 397, 'Macadamia Milk Lab', 0.5),
(380, 398, 'Decaf', 0.5),
(381, 398, 'Extra Shot', 0.5),
(382, 398, 'Lactose Free milk lab', 0.5),
(383, 398, 'Coconut Milk Lab', 0.5),
(384, 398, 'Vanilla Syrup', 0.5),
(385, 398, 'Caramel Syrup', 0.5),
(386, 398, 'Hazelnut Syrup', 0.5),
(387, 398, 'Bonsoy', 0.5),
(388, 398, 'Almond Milk Lab', 0.5),
(389, 398, 'Califia Oat', 0.5),
(390, 398, 'Macadamia Milk Lab', 0.5),
(477, 412, 'Ad', 6),
(833, 435, 'Add Steamed Veg ', 4),
(834, 435, 'Avocado', 4),
(1216, 222, 'Choice of Fresh Orange Juice', 0),
(1217, 222, 'Choice of Fresh Apple Juice', 0),
(1218, 222, 'GF ', 2),
(1219, 222, 'No Lollipop', 0),
(1220, 386, 'GF', 2),
(1221, 386, 'Avo', 4),
(1222, 386, 'Slice Tomato', 2),
(1223, 387, 'GF', 2),
(1224, 391, 'GF', 2),
(1225, 391, 'NO SAUCE', 2),
(1226, 391, 'Hard Egg', 0),
(1227, 391, 'Crispy Bacon', 0),
(1228, 391, 'Avo ', 4),
(1232, 224, 'GF', 2),
(1233, 224, 'NO MAYO', 0),
(1234, 224, 'Tomato sauce instead of MAYO', 0),
(1235, 221, 'Icecream', 2),
(1236, 223, 'Choice of Fresh Orange Juice', 0),
(1237, 223, 'Choice of Fresh Apple Juice', 0),
(1238, 223, 'GF', 2),
(1239, 223, 'NO Lollipop', 0),
(1240, 388, 'GF', 2),
(1241, 388, 'Free Range Bacon', 5.5),
(1242, 388, 'Avo', 4),
(1243, 388, 'Add extra Bread ', 3),
(1244, 388, 'Add extra Egg', 4),
(1245, 389, 'Poached Egg', 4),
(1246, 389, 'Free Range Bacon', 5.5),
(1247, 389, 'GF', 2),
(1406, 230, 'GF', 2),
(1407, 230, 'Soy Linseed', 0),
(1408, 230, 'Fruit Toast', 0),
(1409, 230, 'Jam', 0),
(1410, 230, 'Peanut Butter', 0),
(1411, 230, 'Vegemite', 0),
(1412, 230, 'Avo', 4),
(1572, 415, 'Grilled Chicken', 6),
(1573, 415, 'Homemade Pesto', 2),
(1574, 415, 'No cheese', 0),
(1639, 236, 'Chorizo', 5.5),
(1640, 236, 'Sauteed Mushrooms', 4.5),
(1641, 236, 'Hash Brown', 3.5),
(1642, 236, 'GF', 2),
(1643, 236, 'Hard Egg', 0),
(1644, 236, 'Change to Scrambled Egg', 4),
(1645, 236, 'NO SHALLOTS', 0),
(1721, 434, 'Salad instead of Chips', 0),
(1722, 434, 'GF', 2),
(1723, 434, 'Free Range Bacon', 5.5),
(1734, 425, 'Add Grilled Chicken', 6),
(1735, 425, ' Pesto', 3),
(1736, 425, 'No cheese', 0),
(1737, 427, 'Steamed Veg', 4),
(1738, 427, 'Poached Egg', 4),
(1739, 427, 'Grilled Halloumi', 5),
(1750, 430, 'Vegetarian Option Mixed Veg instead of Chicken', 0),
(1751, 430, 'Avocado', 4),
(1752, 430, 'Steamed Veg', 4),
(1753, 430, 'Grilled Halloumi', 5),
(1754, 430, 'Chorizo', 5.5),
(1759, 411, 'Orange', 0),
(1760, 411, 'Apple ', 0),
(1761, 411, 'Watermelon', 0),
(1762, 411, 'Cucumber', 0),
(1763, 411, 'Celery', 0),
(1764, 411, 'Broccoli', 0),
(1765, 411, 'Ginger', 0),
(1766, 411, 'Lemon', 0),
(1767, 411, 'Beetroot', 0),
(1768, 411, 'No Ice', 1),
(1795, 385, 'Decaf', 0.5),
(1796, 385, 'Extra Shot', 0.5),
(1797, 385, 'Take Away Cup ', 0),
(1866, 428, 'Vegan Option Falafel instead of Egg', 0),
(1867, 428, 'Grilled Chicken', 6),
(1868, 428, 'Poached Chicken', 6),
(1869, 428, 'Avo ', 4),
(1870, 428, 'Hard Egg', 0),
(1871, 428, 'Extra EGG', 4),
(1872, 428, 'Grilled Halloumi', 5),
(1891, 200, 'ADD extra ingredient', 1),
(1892, 200, 'No ice ', 1),
(1895, 392, 'No Choc', 0),
(1896, 392, 'No Marshmallow', 0),
(1897, 392, 'Skim Milk', 0),
(1898, 392, 'Bonsoy', 0.5),
(1899, 392, 'Almond Milk Lab', 0.5),
(1900, 392, 'Oat Califia', 0.5),
(1901, 392, 'Macadamia Milk Lab', 0.5),
(1902, 392, 'Lactose Free Milk Lab', 0.5),
(1903, 392, 'Coconut Milk Lab', 0.5),
(1904, 392, 'IN A BIG CUP ', 2),
(1921, 195, 'ADD extra ingredient', 1),
(1922, 195, 'No ice', 1),
(1923, 204, 'ADD Extra ingredient ', 2),
(1924, 204, 'Vegan Protein Powder ', 2),
(1925, 187, 'Avo', 4),
(1926, 187, 'Poached Egg', 4),
(1927, 187, 'Grilled Halloumi', 5),
(1931, 196, 'ADD extra ingredient', 1),
(1932, 196, 'No ice ', 1),
(1939, 436, 'Salad instead of Chips', 3),
(1940, 436, 'GF', 2),
(1941, 436, 'Free Range Bacon', 5.5),
(1952, 198, 'ADD extra ingredient', 1),
(1953, 198, 'No ice', 1),
(1954, 199, 'ADD extra ingredient', 1),
(1955, 199, 'No ice ', 1),
(1971, 347, 'Strong', 0.5),
(1972, 347, 'Weak', 0),
(1973, 347, 'Decaf', 0.5),
(1974, 347, 'Dash of Milk ', 0),
(1975, 347, 'Syrup (Vanilla, Hazelnut, Caramel', 0.5),
(1976, 347, 'Take Away Cup ', 0),
(2050, 197, 'ADD extra ingredient', 1),
(2051, 197, 'No ice ', 1),
(2077, 211, 'Large Option', 0.5),
(2078, 211, 'NO Grass Fed Butter', 0),
(2079, 211, 'Strong', 0.5),
(2080, 211, 'Take Away Cup ', 0),
(2099, 422, 'Tomato Sauce instead of Aioli', 0),
(2100, 227, 'Apple', 0),
(2101, 227, 'Orange', 0),
(2102, 227, 'Watermelon', 0),
(2103, 227, 'Take Away Cup ', 0),
(2104, 229, 'Banana', 0),
(2105, 229, 'Strawberry', 0),
(2106, 229, 'Vanilla', 0),
(2107, 229, 'Caramel', 0),
(2108, 229, 'Chocolate', 0),
(2109, 229, 'Take Away Cup ', 0),
(2140, 201, 'Choice of Banana', 0),
(2141, 201, 'Choice of Mango', 0),
(2142, 201, 'Choice of Mix Berries', 0),
(2143, 201, 'ADD Extra ingredient ', 2),
(2144, 201, 'Vegan Protein Powder ', 2),
(2149, 413, 'Choice of Mango', 0),
(2150, 413, 'Choice of Banana', 0),
(2151, 413, 'Choice of Mix Berries', 0),
(2152, 413, 'Skim Milk', 0),
(2153, 413, 'Bonsoy', 0.5),
(2154, 413, 'Almond Milk Lab', 0.5),
(2155, 413, 'Oat Califia', 0.5),
(2156, 413, 'Macadamia Milk Lab', 0.5),
(2157, 413, 'Lactose Free Milk Lab', 0.5),
(2158, 413, 'Coconut Milk Lab', 0.5),
(2159, 413, 'NO HONEY', 0),
(2160, 413, 'Take Away Cup ', 0),
(2161, 208, 'ADD Extra ingredient ', 2),
(2162, 208, 'Vegan Protein Powder ', 2),
(2165, 206, 'ADD Extra ingredient ', 2),
(2166, 206, 'Vegan Protein Powder ', 2),
(2167, 210, 'English Breakfast', 0),
(2168, 210, 'Green Tea', 0),
(2169, 210, 'Earl Grey', 0),
(2170, 210, 'Peppermint', 0),
(2171, 210, 'Lemongrass & Ginger', 0),
(2172, 210, 'Chamomile', 0),
(2173, 210, 'Dandelion', 0),
(2174, 210, 'Roobios', 0),
(2175, 210, 'Cold milk on the side', 0),
(2176, 210, 'Hot milk on the side', 0),
(2177, 210, 'Take Away Cup ', 0),
(2178, 210, 'Add Lemon ', 0.5),
(2179, 210, 'Honey', 0),
(2180, 210, 'Take Away Cup ', 0),
(2181, 210, 'Strong', 0.5),
(2210, 219, 'Strong', 0.5),
(2211, 219, 'Weak', 0),
(2212, 219, 'Less Choc', 0),
(2213, 219, 'Skim Milk', 0),
(2214, 219, 'Bonsoy', 0.5),
(2215, 219, 'Almond Milk Lab', 0.5),
(2216, 219, 'Oat Califia', 0.5),
(2217, 219, 'Macadamia Milk Lab', 0.5),
(2218, 219, 'Lactose Free Milk Lab', 0.5),
(2219, 219, 'Coconut Milk Lab', 0.5),
(2220, 219, 'Syrup (Vanilla, Hazelnut, Caramel)', 0.5),
(2221, 219, 'Decaf', 0.5),
(2222, 219, 'Take Away Cup ', 0),
(2223, 383, 'Strong', 0.5),
(2224, 383, 'Decaf', 0.5),
(2225, 383, 'Take Away Cup ', 0),
(2317, 242, 'Poached Egg', 0),
(2318, 242, 'Fried Egg', 0),
(2319, 242, 'Scrambled Egg', 0),
(2320, 242, 'EXTRA EGG', 4),
(2321, 242, 'GF ', 2),
(2322, 242, 'Avo', 4),
(2323, 242, 'Sautéed Mushroom ', 4.5),
(2324, 242, 'Free Range Bacon', 5.5),
(2325, 242, 'Chorizo', 5.5),
(2326, 242, 'Grilled Halloumi', 5),
(2327, 242, 'Steamed Spinach', 4),
(2328, 242, 'Roasted Tomato', 4),
(2329, 242, 'Hash brown ', 3.5),
(2353, 431, 'Salad instead of Chips', 3),
(2354, 431, 'Double Patties', 7),
(2355, 431, 'GF', 2),
(2356, 431, 'Free Range Bacon', 5.5),
(2357, 431, 'Fried Egg', 4),
(2363, 0, 'Honey', 0),
(2364, 0, 'Honey', 0),
(2368, 437, '1', 1),
(2369, 438, '1', 1),
(2370, 439, 'Honey', 0),
(2378, 442, 'Salad instead of Chips', 3),
(2379, 443, 'Salad instead Chips', 3),
(2394, 207, 'ADD Extra ingredient ', 2),
(2395, 207, 'Vegan Protein Powder', 2),
(2396, 203, 'ADD Extra ingredient ', 2),
(2397, 203, 'Vegan Protein Powder ', 2),
(2398, 203, 'Coffee shot', 0.5),
(2399, 202, 'ADD Extra ingredient ', 2),
(2400, 202, 'Vegan Protein Powder ', 2),
(2401, 202, 'Coffee shot', 0.5),
(2402, 205, 'ADD Extra ingredient ', 2),
(2403, 205, 'Vegan Protein Powder ', 2),
(2404, 205, 'Peanut butter', 2),
(2421, 440, 'Oat Milk', 1),
(2422, 440, 'Almond Milk', 1),
(2423, 440, 'Soy', 1),
(2424, 440, 'Skim', 0),
(2425, 440, 'Lactose Free', 1),
(2426, 440, 'Coconut Milk', 1),
(2427, 440, 'Macadamia Milk', 1),
(2466, 241, 'Choice of Poached Egg', 0),
(2467, 241, 'Choice of Fried Egg', 0),
(2468, 241, 'Choice of Scrambled Egg', 0),
(2469, 241, 'Hard Egg', 0),
(2470, 241, 'GF', 2),
(2471, 241, 'Soy Linseed', 0),
(2472, 241, 'Extra EGG', 4),
(2473, 241, 'Free Range Bacon ', 5.5),
(2477, 432, 'Salad Instead of Chips ', 3),
(2478, 432, 'Free Range Bacon', 5.5),
(2479, 432, 'GF', 2),
(2480, 445, 'Almond milk', 1),
(2481, 445, 'Soy milk', 1),
(2482, 445, 'Oat milk', 1),
(2483, 445, 'Lactose free', 1),
(2484, 445, 'Skim milk', 0),
(2485, 445, 'No honey', 0),
(2486, 445, 'No almond', 0),
(2487, 446, 'Bacon', 5.5),
(2488, 446, 'Avo', 4),
(2489, 446, 'Halloumi', 5),
(2490, 446, 'Hash brown ', 3.5),
(2491, 446, 'Mushroom ', 4.5),
(2492, 446, 'GF', 2),
(2493, 447, 'Bacon', 5.5),
(2494, 447, 'Avo', 4),
(2495, 447, 'Halloumi ', 5),
(2496, 447, 'GF', 2),
(2501, 449, 'Extra tomato sauce ', 1),
(2502, 449, 'Extra truffle sauce', 2),
(2503, 450, 'Extra tomato sauce ', 1),
(2504, 450, 'Extra truffle sauce', 2),
(2505, 451, 'Warm', 0),
(2506, 452, 'Warm', 0),
(2507, 453, 'Warm', 0),
(2508, 455, 'Skim', 0),
(2509, 455, 'No whipped cream', 0),
(2510, 455, 'Soy milk', 0.5),
(2511, 455, 'Almond milk', 0.5),
(2512, 455, 'Oat milk', 0.5),
(2513, 455, 'Coffee shot', 0.5),
(2514, 456, 'No whipped cream', 0),
(2515, 456, 'Add coffee', 0.5),
(2516, 456, 'Soy milk', 0.5),
(2517, 456, 'Almond milk', 0.5),
(2518, 456, 'Oat milk', 0.5),
(2534, 190, 'Vegetarian option (mixed veggie instead of chicken)', 0),
(2535, 190, 'Avocado', 4),
(2536, 190, 'Steamed Veg', 4),
(2537, 190, 'Grilled Halloumi', 5),
(2538, 190, 'Chorizo', 5.5),
(2539, 185, 'Vegan option (falafel instead of egg)', 0),
(2540, 185, 'Grilled chicken', 6),
(2541, 185, 'Poached Chicken', 6),
(2542, 185, 'Extra EGG', 4),
(2543, 185, 'Hard Egg', 0),
(2544, 185, 'Avo', 4),
(2545, 185, 'Grilled Halloumi', 5),
(2546, 186, 'Steamed Veg', 4),
(2547, 186, 'Poached Egg', 4),
(2548, 186, 'Grilled Halloumi', 5),
(2549, 184, 'Vegan Option Falafel instead of Egg', 0),
(2550, 184, 'Poached Chicken', 6),
(2551, 184, 'Grilled Chicken', 6),
(2552, 184, 'Avo', 4),
(2553, 184, 'Grilled Haloumi', 5),
(2554, 184, 'Hard Egg', 0),
(2555, 184, 'Extra EGG', 4),
(2560, 194, 'Salad instead of Chips', 3),
(2561, 194, 'GF', 2),
(2562, 194, 'Free Range Bacon', 5.5),
(2575, 191, 'Salad instead of Chips', 3),
(2576, 191, 'Double Patties ', 7),
(2577, 191, 'GF', 2),
(2578, 191, 'Free Range Bacon', 5.5),
(2579, 191, 'Fried Egg', 4),
(2580, 458, 'ADD extra ingredient', 1),
(2581, 458, 'NO Ice', 1),
(2582, 459, 'ADD extra ingredient', 2),
(2583, 459, 'full cream milk', 0),
(2584, 459, 'skim milk', 0),
(2585, 459, 'almond milk', 1),
(2586, 459, 'soy milk', 1),
(2587, 459, 'oat milk', 1),
(2588, 459, 'lactose free milk', 1),
(2589, 460, 'ADD extra ingredient', 2),
(2590, 380, 'Large Option', 0.5),
(2591, 380, 'Strong', 0.5),
(2592, 380, 'Weak', 0),
(2593, 380, 'Skim Milk', 0),
(2594, 380, 'Bonsoy', 0.5),
(2595, 380, 'Almond Milk Lab', 0.5),
(2596, 380, 'Oat Califia', 0.5),
(2597, 380, 'Lactose Free Milk Lab', 0.5),
(2598, 380, 'Coconut Milk Lab', 0.5),
(2599, 380, 'Syrup (vanilla, caramel, hazelnut)', 0.5),
(2600, 380, 'Decaf', 0.5),
(2601, 380, 'Take Away Cup ', 0),
(2602, 379, 'Large Option', 0.5),
(2603, 379, 'Strong', 0.5),
(2604, 379, 'Weak', 0),
(2605, 379, 'Skim Milk', 0),
(2606, 379, 'Bonsoy', 0.5),
(2607, 379, 'Almond Milk Lab', 0.5),
(2608, 379, 'Oat Califia', 0.5),
(2609, 379, 'Lactose Free Milk Lab ', 0.5),
(2610, 379, 'Coconut Milk Lab', 0.5),
(2611, 379, 'Syrup (vanilla, caramel, hazelnut)', 0.5),
(2612, 379, 'Decaf', 0.5),
(2613, 379, 'Take Away Cup ', 0),
(2614, 381, 'Large Option', 0.5),
(2615, 381, 'Strong', 0.5),
(2616, 381, 'Weak', 0),
(2617, 381, 'Skim Milk', 0),
(2618, 381, 'Bonsoy', 0.5),
(2619, 381, 'Almond Milk Lab', 0.5),
(2620, 381, 'Oat Califia', 0.5),
(2621, 381, 'Lactose Free Milk Lab', 0.5),
(2622, 381, 'Coconut Milk Lab', 0.5),
(2623, 381, 'Syrup (vanilla, caramel, hazelnut)', 0.5),
(2624, 381, 'Decaf', 0.5),
(2625, 381, 'Take Away Cup ', 0),
(2626, 265, 'Large Option', 0.5),
(2627, 265, 'Strong', 0.5),
(2628, 265, 'Weak', 0),
(2629, 265, 'Skim Milk', 0),
(2630, 265, 'Bonsoy', 0.5),
(2631, 265, 'Almond Milk Lab', 0.5),
(2632, 265, 'Oat Califia', 0.5),
(2633, 265, 'Lactose Free Milk Lab', 0.5),
(2634, 265, 'Coconut Milk Lab', 0.5),
(2635, 265, 'Syrup(vanilla, caramel, hazelnut)', 0.5),
(2636, 265, 'Decaf', 0.5),
(2637, 265, 'Take Away Cup ', 0),
(2638, 382, 'Strong', 0.5),
(2639, 382, 'Weak', 0),
(2640, 382, 'Skim Milk', 0),
(2641, 382, 'Bonsoy', 0.5),
(2642, 382, 'Almond Milk Lab', 0.5),
(2643, 382, 'Oat Califia', 0.5),
(2644, 382, 'Lactose Free Milk Lab', 0.5),
(2645, 382, 'Coconut Milk Lab', 0.5),
(2646, 382, 'Syrup (vanilla, caramel, hazelnut)', 0.5),
(2647, 382, 'Decaf', 0.5),
(2648, 382, 'Take Away Cup ', 0),
(2689, 220, 'Chocolate', 0),
(2690, 220, 'Vanilla', 0),
(2691, 220, 'Strawberry', 0),
(2692, 220, 'Banana', 0),
(2693, 220, 'Caramel', 0),
(2694, 220, 'Skim Milk', 0),
(2695, 220, 'Bonsoy', 1),
(2696, 220, 'Almond Milk Lab', 1),
(2697, 220, 'Oat Califia', 1),
(2698, 220, 'Lactose Free milk lab', 1),
(2699, 220, 'Coconut Milk Lab', 1),
(2700, 220, 'Take Away Cup ', 0.5),
(2701, 220, 'Thickshakes', 2),
(2702, 216, 'Skim Milk', 0),
(2703, 216, 'Bonsoy', 1),
(2704, 216, 'Almond Milk Lab', 1),
(2705, 216, 'Oat Califia', 1),
(2706, 216, 'Lactose Free milk lab', 1),
(2707, 216, 'Coconut Milk Lab', 1),
(2708, 216, 'Take Away Cup ', 0),
(2709, 216, 'add coffee', 1),
(2710, 218, 'Decaf', 0.5),
(2711, 218, 'Strong', 0.5),
(2712, 218, 'Skim Milk', 0),
(2713, 218, 'Bonsoy', 1),
(2714, 218, 'Almond Milk Lab', 1),
(2715, 218, 'Oat Califa', 1),
(2716, 218, 'Lactose Free Milk Lab', 1),
(2717, 218, 'Coconut Milk Lab', 1),
(2718, 218, 'Syrup ( Vanilla, Hazelnut, Caramel)', 0.5),
(2719, 218, 'Take Away Cup ', 0),
(2720, 396, 'Strong', 0.5),
(2721, 396, 'Weak', 0),
(2722, 396, 'Skim Milk', 0),
(2723, 396, 'Bonsoy', 1),
(2724, 396, 'Almond Milk Lab', 1),
(2725, 396, 'Oat Califia', 1),
(2726, 396, 'Lactose Free milk lab', 1),
(2727, 396, 'Coconut Milk Lab', 1),
(2728, 396, 'Syrup (Vanilla, Hazelnut, Caramel)', 0.5),
(2729, 396, 'Take Away Cup ', 0),
(2730, 348, 'Skim Milk', 0),
(2731, 348, 'Bonsoy', 1),
(2732, 348, 'Almond Milk Lab', 1),
(2733, 348, 'Oat Califia', 1),
(2734, 348, 'Lactose Free milk lab', 1),
(2735, 348, 'Coconut Milk Lab', 1),
(2736, 348, 'Take Away Cup ', 0),
(2737, 348, '2 shots coffee', 1),
(2738, 217, 'Whipped Cream ', 1),
(2739, 217, 'Skim Milk', 0),
(2740, 217, 'Bonsoy', 1),
(2741, 217, 'Almond Milk Lab', 1),
(2742, 217, 'Oat Califia', 1),
(2743, 217, 'Lactose Free milk lab', 1),
(2744, 217, 'Coconut Milk Lab', 1),
(2745, 217, 'Take Away Cup ', 0),
(2749, 457, 'Skim', 0),
(2750, 457, 'Almond ', 0.5),
(2751, 457, 'Soy milk', 0.5),
(2752, 457, 'Oat milk ', 0.5),
(2753, 457, 'Lactose free', 0.5),
(2754, 212, 'Large Option', 0.5),
(2755, 212, 'ADD coffee', 0.5),
(2756, 212, 'Skim Milk', 0),
(2757, 212, 'Bonsoy', 0),
(2758, 212, 'Almond Milk Lab', 0),
(2759, 212, 'Oat Califia', 0),
(2760, 212, 'Lactose Free Milk Lab', 0),
(2761, 212, 'Coconut Milk Lab', 0),
(2762, 212, 'NO HONEY', 0),
(2763, 212, 'Take Away Cup ', 0),
(2764, 213, 'Large Option', 0.5),
(2765, 213, 'Weak', 0),
(2766, 213, 'Extra Choc', 0),
(2767, 213, 'Skim Milk', 0),
(2768, 213, 'Bonsoy', 0.5),
(2769, 213, 'Almond Milk Lab', 0.5),
(2770, 213, 'Oat Califia', 0.5),
(2771, 213, 'Lactose Free Milk Lab', 0.5),
(2772, 213, 'Coconut Milk Lab', 0.5),
(2773, 213, 'Syrup (vanilla, caramel, hazelnut)', 0.5),
(2774, 213, 'Take Away Cup ', 0),
(2775, 215, 'Large Option', 0.5),
(2776, 215, 'Skim Milk', 0),
(2777, 215, 'Bonsoy', 0.5),
(2778, 215, 'Almond Milk Lab', 0.5),
(2779, 215, 'Oat Califia', 0.5),
(2780, 215, 'Lactose Free Milk Lab', 0.5),
(2781, 215, 'Coconut Milk Lab', 0.5),
(2782, 215, 'Syrup (vanilla, caramel, hazelnut)', 0.5),
(2783, 215, 'Honey on the side', 0),
(2784, 215, 'Take Away Cup ', 0),
(2785, 414, 'Large Option', 0.5),
(2786, 414, 'Skim Milk', 0),
(2787, 414, 'Bonsoy', 0),
(2788, 414, 'Almond Milk Lab', 0),
(2789, 414, 'Oat Califia', 0),
(2790, 414, 'Lactose Free Milk Lab', 0),
(2791, 414, 'NO HONEY', 0),
(2792, 414, 'Take Away Cup ', 0),
(2793, 237, 'Vegetarian option (halloumi instead of bacon)', 0),
(2794, 237, 'GF', 2),
(2795, 237, 'Hard Egg', 0),
(2796, 237, 'Easy over Egg ', 0),
(2797, 237, 'Crispy Bacon', 0),
(2798, 237, 'Avo', 4),
(2799, 231, 'GF', 2),
(2800, 231, 'Hash Brown', 3.5),
(2801, 231, 'ADD Free Range Bacon', 5.5),
(2802, 231, 'change to Scrambled Egg ', 4),
(2803, 231, 'Hard Egg', 0),
(2804, 231, 'No Feta', 0),
(2805, 448, 'Bacon', 5.5),
(2806, 448, 'Avo', 4),
(2807, 448, 'Halloumi ', 5),
(2808, 448, 'GF', 2),
(2809, 232, 'Free Range Bacon', 5.5),
(2810, 232, 'Smoked salmon', 6),
(2811, 232, 'Sauteed Mushroom', 4.5),
(2812, 232, 'GF', 2),
(2813, 232, 'Change to Poached Egg', 0),
(2814, 232, 'Change to Scrambled Egg', 4),
(2815, 232, 'Hard Egg', 0),
(2816, 235, 'Free Range Bacon', 5.5),
(2817, 235, 'Hash Brown', 3.5),
(2818, 235, 'GF', 2),
(2819, 235, 'Hard Egg', 0),
(2820, 235, 'Change to Scrambled Egg', 4),
(2821, 183, 'GF', 2),
(2822, 183, 'Hard Egg', 0),
(2823, 183, 'No Feta', 0),
(2824, 183, 'Avo ', 4),
(2825, 183, 'Hash Brown ', 3.5),
(2826, 238, 'Bacon', 0),
(2827, 238, 'SautÃ©ed Mushroom instead of Bacon', 0),
(2828, 238, 'GF', 2),
(2829, 238, 'Avo', 4),
(2830, 238, 'SautÃ©ed Mushroom', 4.5),
(2831, 238, 'Chorizo', 5.5),
(2832, 238, 'Hash Brown ', 3.5),
(2833, 238, 'Grilled Halloumi', 5),
(2834, 238, 'Hard Egg', 0),
(2835, 240, 'Choice of Fried Egg', 0),
(2836, 240, 'Choice of Poached Egg ', 0),
(2837, 240, 'Choice of Scrambled Egg', 0),
(2838, 240, 'GF', 2),
(2839, 240, 'Soy & Linseed ', 0),
(2840, 240, 'Hard Egg ', 0),
(2841, 240, 'Crispy Bacon', 0),
(2842, 240, 'Extra EGG', 4),
(2843, 239, 'Free Range Bacon', 5.5),
(2844, 239, 'Ice cream', 3),
(2845, 239, 'Maple on the side', 0),
(2846, 461, 'Skim ', 0),
(2847, 461, 'Almond', 1),
(2848, 461, 'Soy', 1),
(2849, 461, 'Oat', 1),
(2850, 461, 'Lactose Free', 1),
(2851, 461, 'Honey', 0),
(2852, 461, 'Syrup (Vanilla, Caramel, Hazelnut', 0.5),
(2853, 233, 'Vegetarian option (haloumi instead of bacon)', 0),
(2854, 233, 'Grilled Halloumi', 5),
(2855, 233, 'Hash Brown ', 3.5),
(2856, 233, 'Hard Egg', 0),
(2857, 233, 'Crispy Bacon', 0),
(2858, 193, 'Salad instead of Chips', 3),
(2859, 193, 'GF', 2),
(2860, 193, 'Free Range Bacon', 5.5),
(2861, 192, 'Salad instead of Chips', 3),
(2862, 192, 'GF', 2),
(2863, 192, 'Free Range Bacon', 5.5),
(2864, 188, 'Avo', 4),
(2865, 188, 'Poached Egg', 4),
(2866, 188, 'Grilled Halloumi', 5),
(2867, 188, 'Miso Dressing on the side', 0),
(2868, 225, 'GF', 2),
(2869, 225, 'No sauce', 0),
(2870, 429, 'Vegan Option Falafel instead of Egg', 0),
(2871, 429, ' Grilled Chicken', 6),
(2872, 429, 'Poached Chicken', 6),
(2873, 429, 'Avo', 4),
(2874, 429, 'Extra Egg', 4),
(2875, 429, 'Hard Egg', 0),
(2876, 429, 'Grilled Halloumi', 5),
(2877, 384, 'Large Option', 0.5),
(2878, 384, 'Strong', 0.5),
(2879, 384, 'Weak ', 0),
(2880, 384, 'Milk on the side', 0),
(2881, 384, 'Hot Milk on the side', 0),
(2882, 384, 'Decaf ', 0.5),
(2883, 384, 'Syrup (vanilla, caramel, hazelnut)', 0.5),
(2884, 384, 'Take Away Cup ', 0);

-- --------------------------------------------------------

--
-- Table structure for table `purchase`
--

CREATE TABLE `purchase` (
  `purchaseid` int(11) NOT NULL,
  `guest_code` varchar(30) DEFAULT NULL,
  `productid` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `seen` int(11) DEFAULT 0 COMMENT '0:unseen,1:seen',
  `date_purchase` varchar(30) DEFAULT NULL,
  `time_purchase` varchar(30) DEFAULT NULL,
  `note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_option`
--

CREATE TABLE `purchase_option` (
  `id` int(11) NOT NULL,
  `purchase_id` int(11) NOT NULL,
  `option_id` int(11) NOT NULL,
  `choice` varchar(255) NOT NULL,
  `price` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reset_counter`
--

CREATE TABLE `reset_counter` (
  `rid` int(11) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `ctime` varchar(30) DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `reset_counter`
--

INSERT INTO `reset_counter` (`rid`, `status`, `ctime`) VALUES
(1, 1, '21-04-2026 13:36:21');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_login`
--
ALTER TABLE `admin_login`
  ADD PRIMARY KEY (`aid`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`categoryid`);

--
-- Indexes for table `guest`
--
ALTER TABLE `guest`
  ADD PRIMARY KEY (`gid`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`productid`);

--
-- Indexes for table `product_option`
--
ALTER TABLE `product_option`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `purchase`
--
ALTER TABLE `purchase`
  ADD PRIMARY KEY (`purchaseid`);

--
-- Indexes for table `purchase_option`
--
ALTER TABLE `purchase_option`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reset_counter`
--
ALTER TABLE `reset_counter`
  ADD PRIMARY KEY (`rid`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_login`
--
ALTER TABLE `admin_login`
  MODIFY `aid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=216;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `categoryid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `guest`
--
ALTER TABLE `guest`
  MODIFY `gid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5073;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `productid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=462;

--
-- AUTO_INCREMENT for table `product_option`
--
ALTER TABLE `product_option`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2885;

--
-- AUTO_INCREMENT for table `purchase`
--
ALTER TABLE `purchase`
  MODIFY `purchaseid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5300;

--
-- AUTO_INCREMENT for table `purchase_option`
--
ALTER TABLE `purchase_option`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3910;

--
-- AUTO_INCREMENT for table `reset_counter`
--
ALTER TABLE `reset_counter`
  MODIFY `rid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
