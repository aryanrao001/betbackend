import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
// placeTossBet.js
import tossModel from '../models/tossModel.js';
import tossResult from "../models/tossResult.js";
import slotModel from "../models/slotModel.js";
import slottModel from "../models/slottModel.js";
import spinModel from "../models/spinModel.js";
import spinResult from "../models/spinResult.js";




// ==== Toss Game ==== //

// const bet_placed = async (req , res) => {
//     try {
//         const { token , amount , userChoice } = req.body;
//         if(!token){
//             return res.json({success:false , message:" First Login In "});
//         }
//         let decoded;
//         try {
//             decoded = jwt.verify(token,process.env.JWT_SECRET);
//             console.log(decoded)
//         } catch (error) {
//             console.log(tokenError);
//             return res.json({success:false, message:"Invalid Login"})
//         }
//         const user_id = decoded.id;
//         const userData = await userModel.findById(user_id);
//         if(!userData){
//             return res.json({success:false, message:"User Not Found "})
//         }
//         const userName = userData.name;
//         if (!['heads', 'tails'].includes(userChoice)) {
//             return res.json({ success: false, message: "Invalid side. Choose 'heads' or 'tails'." });
//         }
//         if (userData.balance < amount) {
//             return res.json({ success: false, message: "Insufficient balance " });
//         }

//         userData.balance -= amount;
//         await userData.save();

//         const newbet = await tossModel.create({
//             userId:user_id,
//             userName:userName,
//             betAmount:amount,
//             chosenSide:userChoice
//         });

//         res.json({ success: true, message: "Bet placed successfully", betId: newbet._id });


//     } catch (error) {
//         console.log(error);
//     }
// }


// // ==== Toss Game ==== //


// const declareResult = async (req, res) => {
//   try {
//     const pendingBets = await tossModel.find({status: 'pending'});

//     if (pendingBets.length > 0) {
//       let headsTotal = 0;
//       let tailsTotal = 0;

//       pendingBets.forEach(bet => {
//         if (bet.selectedItem === 'heads') {
//           headsTotal += bet.betAmount;
//         } else if (bet.selectedItem === 'tails') {
//           tailsTotal += bet.betAmount;
//         }
//       });

//       console.log(headsTotal);
//       console.log(tailsTotal);  
//       console.log(pendingBets);


//       let result;
//       if (headsTotal < tailsTotal) {
//         result = "heads";
//       } else {
//         result = "tails";
//       }

//       for (const bet of pendingBets) {
//         const isWin = bet.selectedItem === result;
//         const statusUpdate = isWin ? "won" : "lost";
      
//         if (isWin) {
//           const user = await userModel.findById(bet.userId);
//           if (user) {
//             user.balance += bet.betAmount * 2;
//             await user.save();
//           }
//         }
      
//         await tossModel.findByIdAndUpdate(bet._id, {
//           $set: {
//             status: statusUpdate,
//             resultSide: result,
//             resolvedAt: new Date(),
//           }
//         });
//       }

//       console.log(result);

//       const newResult = new tossResult({
//         winningSide: result,
//         result: result,    // 👈 ADDING THIS
//         createdAt: new Date(),
//       });

//       await newResult.save();

//       return res.status(200).json({
//         success: true,
//         message: `Result declared successfully by bets: ${result.toUpperCase()}`,
//         result: result,
//       });

//     } else {
//       const outcomes = ["heads", "tails"];
//       const randomIndex = Math.floor(Math.random() * outcomes.length);
//       const result = outcomes[randomIndex];

//       const newResult = new tossResult({
//         winningSide: result,
//         result: result,    // 👈 ADDING THIS
//         createdAt: new Date(),
//       });

//       console.log(newResult)

//       await newResult.save();

//       return res.status(200).json({
//         success: true,
//         message: `Result declared successfully by random : ${result.toUpperCase()}`,
//         result: result,
//       });

//     }
//   } catch (error) {
//     console.error("Error declaring toss result:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server Error in declaring result",
//     });
//   }
// };



const bet_placed = async (req, res) => {
  try {
    const { token, amount, userChoice } = req.body;

    if (!token) {
      return res.json({ success: false, message: "First login in" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.json({ success: false, message: "Invalid token" });
    }

    const user_id = decoded.id;
    const userData = await userModel.findById(user_id);

    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    const userName = userData.name;

    if (!['heads', 'tails'].includes(userChoice)) {
      return res.json({ success: false, message: "Invalid choice. Choose 'heads' or 'tails'." });
    }

    if (userData.balance < amount) {
      return res.json({ success: false, message: "Insufficient balance" });
    }

    // Deduct balance
    userData.balance -= amount;
    await userData.save();

    // Create new bet
    const newBet = await tossModel.create({
      userId: user_id,
      userName: userName,
      betAmount: amount,
      selectedItem: userChoice, // Use consistent key name
      status: 'pending'
    });

    return res.json({ success: true, message: "Bet placed successfully", betId: newBet._id });

  } catch (error) {
    console.error("Error placing bet:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};





// ====== DECLARE RESULT ======
const getBiasedResult = (userChoice, bias = 0.6) => {
  const rand = Math.random();
  return rand < bias ? userChoice : (userChoice === 'heads' ? 'tails' : 'heads');
};
const declareResult = async (req, res) => {
  try {
    const cutoffTime = new Date(Date.now() - 20000); // 20 seconds ago
    const pendingBets = await tossModel.find({ 
      status: 'pending', 
      createdAt: { $lte: cutoffTime } 
    });

    console.log(`🕒 Found ${pendingBets.length} pending bets`);

    let result;

    if (pendingBets.length > 1) {
      let headsTotal = 0;
      let tailsTotal = 0;

      pendingBets.forEach(bet => {
        if (bet.chosenSide === 'heads') headsTotal += bet.betAmount;
        else if (bet.chosenSide === 'tails') tailsTotal += bet.betAmount;
      });

      result = headsTotal < tailsTotal ? 'heads' : 'tails';

    } else if (pendingBets.length === 1) {
      const userBet = pendingBets[0];
      result = getBiasedResult(userBet.chosenSide);
      console.log(`🎯 One user played. User selected: ${userBet.chosenSide}, Biased result declared: ${result}`);
    } else {
      const outcomes = ['heads', 'tails'];
      result = outcomes[Math.floor(Math.random() * outcomes.length)];
      console.log(`⚠️ No bets. Declared random result: ${result}`);
    }

    for (const bet of pendingBets) {
      const isWin = bet.chosenSide === result;
      const statusUpdate = isWin ? 'won' : 'lost';

      if (isWin) {
        const user = await userModel.findById(bet.userId);
        if (user) {
          user.balance += bet.betAmount * 2;
          await user.save();
        }
      }

      await tossModel.findByIdAndUpdate(bet._id, {
        $set: {
          status: statusUpdate,
          resultSide: result,
          resolvedAt: new Date(),
        }
      });
    }

    await new tossResult({
      winningSide: result,
      result: result,
      createdAt: new Date()
    }).save();

    return res.status(200).json({
      success: true,
      message: `✅ Result declared successfully: ${result.toUpperCase()}`,
      result
    });

  } catch (error) {
    console.error("❌ Error declaring toss result:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in declaring result"
    });
  }
};


// ==== Spin Game ==== //
const winChance = 99;  // 10% win chance, can be customized from admin later.

const calculateSlotResult = () => {
  const randomChance = Math.random() * 100;
  return randomChance < winChance ? "win" : "lose";
};

const slotGameResult = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { betAmount, selectedItem } = req.body;

    console.log(betAmount, selectedItem);
    console.log(token);

    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    if (!betAmount || betAmount <= 0 || selectedItem === undefined) {
      return res.status(400).json({ success: false, message: "Invalid bet amount or chosen side" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const userId = decoded.id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if user has enough balance
    if (user.balance < betAmount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    // Deduct the bet amount first
    user.balance -= betAmount;
    const userName = user.name;

    await user.save();

    // Calculate the result (win or lose)
    const result = calculateSlotResult();

    let resultSide;

    if (result === "win") {
      // If win, resultSide should be same as selectedItem
      resultSide = parseInt(selectedItem);
      // Add winnings
      user.balance += betAmount * 2;
      await user.save();
    } else {
      // If lose, resultSide should be different than selectedItem
      const availableNumbers = Array.from({ length: 8 }, (_, i) => i).filter(num => num !== parseInt(selectedItem));
      resultSide = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    }

    // Save the slot result
    const newSlot = new slotModel({
      userId: userId,
      userName,
      betAmount: betAmount,
      chosenSide: selectedItem,
      result: result,
      resultSide: resultSide,
    });

    await newSlot.save();

    return res.status(200).json({
      success: true,
      message: result === "win" ? "You Win!" : "You Lose",
      // newBalance: user.balance,
      resultSide: resultSide,   // <-- SEND random number to frontend
    });

  } catch (error) {
    console.error("Error in slot game logic:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in slot game logic",
    });
  }
};


const slotGameResulttwo = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { betAmount, selectedItem } = req.body;

    console.log(betAmount, selectedItem);
    console.log(token);

    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    if (!betAmount || betAmount <= 0 || selectedItem === undefined) {
      return res.status(400).json({ success: false, message: "Invalid bet amount or chosen side" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const userId = decoded.id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if user has enough balance
    if (user.balance < betAmount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    // Deduct the bet amount first
    user.balance -= betAmount;
    const userName = user.name;

    await user.save();

    // Calculate the result (win or lose)
    const result = calculateSlotResult();

    let resultSide;

    if (result === "win") {
      // If win, resultSide should be same as selectedItem
      resultSide = parseInt(selectedItem);
      // Add winnings
      user.balance += betAmount * 2;
      await user.save();
    } else {
      // If lose, resultSide should be different than selectedItem
      const availableNumbers = Array.from({ length: 3 }, (_, i) => i).filter(num => num !== parseInt(selectedItem));
      resultSide = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    }

    // Save the slot result
    const newSlot = new slottModel({
      userId: userId,
      userName,
      betAmount: betAmount,
      chosenSide: selectedItem,
      result: result,
      resultSide: resultSide,
    });

    await newSlot.save();

    return res.status(200).json({
      success: true,
      message: result === "win" ? "You Win!" : "You Lose",
      // newBalance: user.balance,
      resultSide: resultSide,   // <-- SEND random number to frontend
    });

  } catch (error) {
    console.error("Error in slot game logic:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in slot game logic",
    });
  }
};







//  ===== Spin Game ====== //

const spinbet_placed = async (req, res) => {
  try {
    const { amount, userChoice } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.json({ success: false, message: "You are not logged in" });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET); // Fixed typo here
      console.log(decoded);
    } catch (error) {
      console.log(error);
      return res.json({ success: false, message: " Login Again pls " });
    }

    const user_id = decoded.id;
    const userData = await userModel.findById(user_id);
    
    if (!userData) {
      return res.json({ success: false, message: "User Not Found" });
    }

    const userName = userData.name;

    if (userData.balance < amount) {
      return res.json({ success: false, message: "Insufficient Balance" });
    }

    // Deduct the amount from user balance
    userData.balance -= amount;
    await userData.save(); // Ensure balance is updated properly

    // Create new spin bet
    const newBet = await spinModel.create({
      userId: user_id,
      userName: userName,
      betAmount: amount,
      chosenSide: userChoice, // Make sure this field matches your schema
    });

    // Send success response
    res.json({ success: true,message: `Bet of amount ${amount} on ${userChoice} has been placed` });

  } catch (error) {
    console.log(error);
    res.json({ success: false,message: "Something went wrong" }); // Handle error properly
  }
};


// const bet_placed = async (req , res) => {
//   try {
//       const { token , amount , userChoice } = req.body;
//       if(!token){
//           return res.json({success:false , message:" First Login In "});
//       }
//       let decoded;
//       try {
//           decoded = jwt.verify(token,process.env.JWT_SECRET);
//           console.log(decoded)
//       } catch (error) {
//           console.log(tokenError);
//           return res.json({success:false, message:"Invalid Login"})
//       }
//       const user_id = decoded.id;
//       const userData = await userModel.findById(user_id);
//       if(!userData){
//           return res.json({success:false, message:"User Not Found "})
//       }
//       const userName = userData.name;
//       if (!['heads', 'tails'].includes(userChoice)) {
//           return res.json({ success: false, message: "Invalid side. Choose 'heads' or 'tails'." });
//       }
//       if (userData.balance < amount) {
//           return res.json({ success: false, message: "Insufficient balance " });
//       }

//       userData.balance -= amount;
//       await userData.save();

//       const newbet = await tossModel.create({
//           userId:user_id,
//           userName:userName,
//           betAmount:amount,
//           selectedItem:userChoice
//       });

//       res.json({ success: true, message: "Bet placed successfully", betId: newbet._id });


//   } catch (error) {
//       console.log(error);
//   }
// }



// const declareResultspin = async (req, res) => {
//   try {
//     // 1. Fetch all pending bets
//     const pendingBets = await spinModel.find({ status: "pending" });

//     if (pendingBets.length === 0) {
//       const randomResult = Math.floor(Math.random() * 50) + 1; // Random number 1-50
//       return res.status(200).json({ message: "No pending bets", result: randomResult });
//     }

//     // 2. Group bets by number
//     const groupedBets = {};
//     pendingBets.forEach(bet => {
//       const choice = bet.userChoice;
//       if (!groupedBets[choice]) {
//         groupedBets[choice] = [];
//       }
//       groupedBets[choice].push(bet);
//     });

//     const uniqueChoices = Object.keys(groupedBets);

//     let finalResult;

//     if (uniqueChoices.length >= 3) {
//       // Case: 3 or more choices — pick one with most total amount
//       finalResult = uniqueChoices.reduce((bestChoice, current) => {
//         const totalCurrent = groupedBets[current].reduce((sum, b) => sum + b.amount, 0);
//         const totalBest = groupedBets[bestChoice].reduce((sum, b) => sum + b.amount, 0);
//         return totalCurrent > totalBest ? current : bestChoice;
//       });
//     } else if (uniqueChoices.length === 2) {
//       // Case: 2 users — same logic
//       finalResult = uniqueChoices.reduce((bestChoice, current) => {
//         const totalCurrent = groupedBets[current].reduce((sum, b) => sum + b.amount, 0);
//         const totalBest = groupedBets[bestChoice].reduce((sum, b) => sum + b.amount, 0);
//         return totalCurrent > totalBest ? current : bestChoice;
//       });
//     } else if (uniqueChoices.length === 1) {
//       // Case: Only 1 person played
//       const userNumber = parseInt(uniqueChoices[0]);
//       const random = Math.random(); // between 0 and 1
//       if (random <= 0.6) {
//         finalResult = userNumber; // 60% win chance
//       } else {
//         // Return any other number except userNumber
//         const otherNumbers = Array.from({ length: 50 }, (_, i) => i + 1).filter(n => n !== userNumber);
//         finalResult = otherNumbers[Math.floor(Math.random() * otherNumbers.length)];
//       }
//     }

//     // 3. Update bets to "completed"
//     await spinModel.updateMany({ status: "pending" }, { $set: { status: "completed", result: finalResult } });

//     return res.status(200).json({ success: true, result: parseInt(finalResult) });
//   } catch (err) {
//     console.error("❌ Error in declareResult:", err);
//     return res.status(500).json({ success: false, message: "Server Error" });
//   }
// };


// import spinModel from "../models/spinModel.js";
// import userModel from "../models/userModel.js"; // assuming this exists

const declareResultspin = async (req, res) => {
  try {
    const pendingBets = await spinModel.find({ status: "pending" });

    if (pendingBets.length === 0) {
      const randomResult = Math.floor(Math.random() * 50) + 1;
      return res.status(200).json({
        success: true,
        message: "No pending bets",
        result: randomResult,
      });
    }

    // Group pending bets by chosenSide
    const groupedBets = {};
    pendingBets.forEach((bet) => {
      const choice = bet.chosenSide;
      if (!groupedBets[choice]) {
        groupedBets[choice] = [];
      }
      groupedBets[choice].push(bet);
    });

    const uniqueChoices = Object.keys(groupedBets).map(Number);
    let finalResult;

    if (uniqueChoices.length >= 2) {
      // Choose number with the minimum total bet amount
      finalResult = uniqueChoices.reduce((minChoice, current) => {
        const currentTotal = groupedBets[current].reduce(
          (sum, b) => sum + b.betAmount,
          0
        );
        const minTotal = groupedBets[minChoice].reduce(
          (sum, b) => sum + b.betAmount,
          0
        );
        return currentTotal < minTotal ? current : minChoice;
      });
    } else if (uniqueChoices.length === 1) {
      // Only one number placed
      const userNumber = uniqueChoices[0];
      const random = Math.random();
      if (random <= 0.6) {
        finalResult = userNumber;
      } else {
        const otherNumbers = Array.from({ length: 50 }, (_, i) => i + 1).filter(
          (n) => n !== userNumber
        );
        finalResult =
          otherNumbers[Math.floor(Math.random() * otherNumbers.length)];
      }
    }

    // Process each pending bet
    for (let bet of pendingBets) {
      const isWin = parseInt(bet.chosenSide) === parseInt(finalResult);

      // Fetch user
      const user = await userModel.findById(bet.userId);
      if (user && isWin) {
        user.balance += bet.betAmount * 2;
        await user.save();
        bet.status = "win";
      } else {
        bet.status = "lose";
      }

      bet.resultSide = finalResult;
      bet.resolvedAt = new Date();
      await bet.save();
    }

    // Save result
    const newResult = await spinResult.create({
      result: finalResult,
    });

    // await newResult.save();

    return res.status(200).json({ success: true, result: finalResult });
  } catch (err) {
    console.error("❌ Error in declareResultspin:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};



// ===== Sending Toss Result ===== //
const sendTossResult = async (req, res) => {
  try {
    // Get the 10 most recent bets sorted by creation time (assuming you have timestamps)
    const newBets = await tossResult.find().sort({ createdAt:-1}).limit(10);
    return res.status(200).json({ success: true, bets: newBets });
  } catch (error) {
    console.error("Error in sendTossResult:", error);
    return res.status(500).json({ success:false,message: "Internal Server Error" });
  }
};



const currentround = async(req, res)=>{
  const now = new Date();
  const seconds = now.getSeconds();
  const currentRoundStart = new Date(now);
  currentRoundStart.setSeconds( seconds - (seconds % 30 ));

  const currentRoundEnd = new Date(currentRoundStart.getTime() + 30 * 1000);

  res.json({
    serverTime: now.toISOString(),
    roundStart: currentRoundStart.toISOString(),
    roundEnd: currentRoundEnd.toISOString(),
  });

}



export { bet_placed , declareResult  , slotGameResult , slotGameResulttwo ,spinbet_placed , declareResultspin , sendTossResult , currentround };