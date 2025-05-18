// betsController.js
// import { decode } from "jsonwebtoken";
import jwt from "jsonwebtoken"
import userModel from "../models/userModel.js";
import tossModel from "../models/tossModel.js";
import TossResult from "../models/tossResult.js";
// import TossResult from "../models/tossResult";

// In-memory bets store — reset after each toss round
let currentBets = { heads: [], tails: [] };
let isBettingOpen = true; // Allow bets only when true
let currentResult = null; // Store result to broadcast

// 👉 Set betting status externally
const setBettingStatus = (status) => {
  isBettingOpen = status;
};

// 👉 Reset bets externally
const resetBets = () => {
  currentBets = { heads: [], tails: [] };
};

// 👉 Used by roundManager to calculate result
function calculateTossResult(bets) {
  const totalHeads = bets.heads.reduce((sum, bet) => sum + bet.amount, 0);
  const totalTails = bets.tails.reduce((sum, bet) => sum + bet.amount, 0);

  let result;
  if (totalHeads < totalTails) {
    result = 'heads';
  } else if (totalTails < totalHeads) {
    result = 'tails';
  } else {
    // Tie: choose randomly
    result = Math.random() < 0.5 ? 'heads' : 'tails';
  }

  return {
    success: true,
    message: `✅ Result declared successfully: ${result.toUpperCase()}`,
    result,
    totalHeads,
    totalTails,
  };
}




// 🎯 Place a user bet
const placeBet = async (req, res) => {
  try {
    const { side, amount } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if(!token){
      return res.json({success:false, message: ' You are not logged in.'});
    }


    let decoded;
    try {
      decoded = jwt.verify(token,process.env.JWT_SECRET);
      // decoded = jwt.verify(token, process.env.JWT_SECRET);

    } catch (error) {
      return res.json({success:false, message: 'Invalid token.'});
    }

    const userId = decoded.id;
    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: 'User not found.' });
    }

    const userName = userData.name;

    if (!['heads', 'tails'].includes(side)) {
      return res.json({ success: false, message: "Invalid choice. Choose 'heads' or 'tails'." });
    }

    if(userData.balance < amount){
      return res.json({ success: false, message: "Insufficient balance." });
    }

    // const newBet = await tossModel.create({
    //   userId: user_id,
    //   userName: userName,
    //   betAmount: amount,
    //   selectedItem: userChoice, // Use consistent key name
    //   status: 'pending'
    // });

    console.log(req.body);

    if (!isBettingOpen) {
      return res.json({ message: '❌ Betting is currently closed' });
    }

    if (!userId || !side || !amount) {
      return res.json({success:false, message: 'Missing userId, side or amount' });
    }
    if (amount <= 0) {
      return res.json({success:false, message: 'Amount must be positive' });
    }

    // Store bet
    // currentBets[side].push({ userId, amount: Number(amount) });

    userData.balance -= amount;
    await userData.save();

    const newBet = await tossModel.create({
      userId,
      userName,
      betAmount: amount,
      chosenSide : side,
      status:'pending'
    }) 

    return res.json({
      success:true,
      message: '✅ Bet placed successfully',
      // currentBets
    });

  } catch (error) {
    console.error('Error placing bet:', error);
    return res.json({ message: 'Internal Server Error' });
  }
};








// try {
//     const { token, amount, userChoice } = req.body;

//     if (!token) {
//       return res.json({ success: false, message: "First login in" });
//     }

//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (error) {
//       return res.json({ success: false, message: "Invalid token" });
//     }

//     const user_id = decoded.id;
//     const userData = await userModel.findById(user_id);

//     if (!userData) {
//       return res.json({ success: false, message: "User not found" });
//     }

//     const userName = userData.name;

//     if (!['heads', 'tails'].includes(userChoice)) {
//       return res.json({ success: false, message: "Invalid choice. Choose 'heads' or 'tails'." });
//     }

//     if (userData.balance < amount) {
//       return res.json({ success: false, message: "Insufficient balance" });
//     }

//     // Deduct balance
//     userData.balance -= amount;
//     await userData.save();

//     // Create new bet
//     const newBet = await tossModel.create({
//       userId: user_id,
//       userName: userName,
//       betAmount: amount,
//       selectedItem: userChoice, // Use consistent key name
//       status: 'pending'
//     });

//     return res.json({ success: true, message: "Bet placed successfully", betId: newBet._id });

//   } catch (error) {
//     console.error("Error placing bet:", error);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }







// 🧠 Optionally call this manually for testing
// const declareTossResult = (req, res) => {
//   try {
//     if (currentBets.heads.length === 0 && currentBets.tails.length === 0) {
//       return res.status(400).json({ error: 'No bets placed' });
//     }

//     const tossResult = calculateTossResult(currentBets);

//     // TODO: Update user wallets here (after you connect DB users)

//     // Reset for next round
//     resetBets();

//     return res.status(200).json(tossResult);
//   } catch (error) {
//     console.error('Error declaring toss result:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// const declareTossResult = async (req, res) => {
//   try {
//     if (currentBets.heads.length === 0 && currentBets.tails.length === 0) {
//       return res.status(400).json({ error: 'No bets placed' });
//     }

//     // 1. Calculate toss result
//     const tossResult = calculateTossResult(currentBets);
//     const resultSide = tossResult.result;

//     // 2. Fetch all pending bets
//     const pendingBets = await tossModel.find({status:'pending'});
//     console.log(pendingBets);

//     // 3. Process each bet
//     for (const bet of pendingBets) {
//       const user = await userModel.findById(bet.userId);
//       if (!user) continue;

//       let status = 'lose';

//       // 4. Check if user won
//       if (bet.chosenSide === resultSide) {
//         status = 'win';
//         const winningAmount = bet.betAmount * 2;
//         user.balance += winningAmount;
//         await user.save();
//       }

//       // 5. Update bet with result
//       bet.status = status;
//       bet.resultSide = resultSide;
//       await bet.save();
//     }

//     // 6. Reset in-memory bet tracker
//     resetBets();

//     // 7. Send final result back
//     return res.status(200).json(tossResult);
//   } catch (error) {
//     console.error('Error declaring toss result:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// };


// const declareTossResult = async (req, res) => {
//   try {
//     console.log('🎯 declareTossResult() called');

//     // 1. Check if any in-memory bets are placed
//     if (currentBets.heads.length === 0 && currentBets.tails.length === 0) {
//       console.warn('⚠️ No bets in memory');
//       return res.status(400).json({ error: 'No bets placed' });
//     }

//     // 2. Calculate toss result
//     const tossResult = calculateTossResult(currentBets);
//     const resultSide = tossResult.result;
//     console.log('🪙 Toss result calculated:', resultSide);

//     // 3. Fetch all pending bets from DB
//     const pendingBets = await tossModel.find({ status: 'pending' });
//     console.log(`🔍 Found ${pendingBets.length} pending bets`);

//     // 4. Loop through each bet
//     for (const bet of pendingBets) {
//       console.log(`\n➡️ Processing bet ID: ${bet._id}`);
//       console.log(`👤 User ID: ${bet.userId}, Chosen Side: ${bet.chosenSide}, Bet: ${bet.betAmount}`);

//       // 5. Fetch user by ID
//       const user = await userModel.findById(bet.userId);

//       if (!user) {
//         console.warn(`❌ User not found: ${bet.userId}`);
//         continue;
//       }

//       let status = 'lose';

//       // 6. Check if bet wins
//       if (bet.chosenSide === resultSide) {
//         status = 'win';
//         const winningAmount = bet.betAmount * 2;
//         user.balance += winningAmount;
//         await user.save();
//         console.log(`✅ User ${user.userName} WON! New Balance: ${user.balance}`);
//       } else {
//         console.log(`❌ User ${user.userName} lost`);
//       }

//       // 7. Update bet with result
//       bet.status = status;
//       bet.resultSide = resultSide;
//       await bet.save();
//       console.log(`📌 Bet updated with status: ${status}, resultSide: ${resultSide}`);
//     }

//     // 8. Reset memory tracker
//     resetBets();
//     console.log('🔄 In-memory bets reset');

//     // 9. Send result back
//     console.log('✅ Toss round completed successfully');
//     return res.status(200).json(tossResult);
//   } catch (error) {
//     console.error('❗ Error in declareTossResult:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// };




// const declareTossResultFunction = async () => {
//   try {
//     if (currentBets.heads.length === 0 && currentBets.tails.length === 0) {
//       console.warn('No bets placed');
//       return { result: null, message: 'No bets placed' };
//     }

//     const tossResult = calculateTossResult(currentBets);
//     const resultSide = tossResult.result;

//     const pendingBets = await tossModel.find({ status: 'pending' });

//     for (const bet of pendingBets) {
//       const user = await userModel.findById(bet.userId);
//       if (!user) continue;

//       let status = 'lose';
//       if (bet.chosenSide === resultSide) {
//         status = 'win';
//         user.balance += bet.betAmount * 2;
//         await user.save();
//       }

//       bet.status = status;
//       bet.resultSide = resultSide;
//       await bet.save();
//     }

//     resetBets();
//     return tossResult;
//   } catch (error) {
//     console.error('Error in declareTossResultFunction:', error);
//     return { result: null, error: true };
//   }
// };




// const declareTossResultFunction = async () => {
//   try {
//     const pendingBets = await tossModel.find({ status: 'pending' });

//     // If no pending bets, return random result
//     if (pendingBets.length === 0) {
//       const randomResult = Math.random() < 0.5 ? 'heads' : 'tails';
//       console.warn('No pending bets. Random result generated:', randomResult);
//       return { result: randomResult, message: 'No pending bets, random result generated' };
//     }

//     if (currentBets.heads.length === 0 && currentBets.tails.length === 0) {
//       console.warn('No bets placed');
//       return { result: null, message: 'No bets placed' };
//     }

//     const tossResult = calculateTossResult(currentBets);
//     const resultSide = tossResult.result;

//     for (const bet of pendingBets) {
//       const user = await userModel.findById(bet.userId);
//       if (!user) continue;

//       let status = 'lose';
//       if (bet.chosenSide === resultSide) {
//         status = 'win';
//         user.balance += bet.betAmount * 2;
//         await user.save();
//       }

//       bet.status = status;
//       bet.resultSide = resultSide;
//       await bet.save();
//     }

//     resetBets();
//     return tossResult;
//   } catch (error) {
//     console.error('Error in declareTossResultFunction:', error);
//     return { result: null, error: true };
//   }
// };





const declareTossResultFunction = async () => {
  try {
    const pendingBets = await tossModel.find({ status: 'pending' });

    // If no pending bets, return random result
    if (pendingBets.length === 0) {
      const randomResult = Math.random() < 0.5 ? 'heads' : 'tails';
      console.warn('No pending bets. Random result generated:', randomResult);

      // ✅ Save to TossResult model
      await TossResult.create({ winningSide: randomResult });

      return { result: randomResult, message: 'No pending bets, random result generated' };
    }

    // if (currentBets.heads.length === 0 && currentBets.tails.length === 0) {

        const totalHeadsAmount = currentBets.heads.reduce((acc, bet) => acc + bet.amount, 0);
        const totalTailsAmount = currentBets.tails.reduce((acc, bet) => acc + bet.amount, 0);

        if (totalHeadsAmount > totalTailsAmount) {

          return{ result : 'tails' , message : 'Heads amount is less than Tails amount' };

        } else if (totalTailsAmount > totalHeadsAmount) {
          return{ result : 'heads' , message : 'Heads amount is less than Heads amount' };

        // result = 'heads';
        } else {
        // result = Math.random() < 0.5 ? 'heads' : 'tails';
        }
    //   console.warn('No bets placed');
    //   return { result: randomResult, message: 'No bets placed' };
    // }

    const tossResult = calculateTossResult(currentBets);
    const resultSide = tossResult.result;

    for (const bet of pendingBets) {
      const user = await userModel.findById(bet.userId);
      if (!user) continue;

      let status = 'lose';
      if (bet.chosenSide === resultSide) {
        status = 'win';
        user.balance += bet.betAmount * 2;
        await user.save();
      }

      bet.status = status;
      bet.resultSide = resultSide;
      await bet.save();
    }

    // ✅ Save the calculated result to TossResult model
    await TossResult.create({ winningSide: resultSide });

    resetBets();
    return tossResult;
  } catch (error) {
    console.error('Error in declareTossResultFunction:', error);
    return { result: null, error: true };
  }
};




// const declareTossResultFunction = async () => {
//   try {
//     const pendingBets = await tossModel.find({ status: 'pending' });

//     // If no pending bets at all
//     if (pendingBets.length === 0) {
//       const randomResult = Math.random() < 0.5 ? 'heads' : 'tails';
//       console.warn('No pending bets. Random result generated:', randomResult);

//       await TossResult.create({ winningSide: randomResult });

//       return { result: randomResult, message: 'No pending bets, random result generated' };
//     }

//     // ✅ If currentBets is empty or both sides have zero bets
//     if (
//       !currentBets ||
//       (currentBets.heads?.length === 0 && currentBets.tails?.length === 0)
//     ) {
//       const randomResult = Math.random() < 0.5 ? 'heads' : 'tails';
//       console.warn('No active bets in currentBets. Random result:', randomResult);

//       await TossResult.create({ winningSide: randomResult });

//       return { result: randomResult, message: 'No active bets, random result used' };
//     }

//     // ✅ Proceed with result calculation
//     const tossResult = calculateTossResult(currentBets);
//     const resultSide = tossResult.result;

//     for (const bet of pendingBets) {
//       const user = await userModel.findById(bet.userId);
//       if (!user) continue;

//       let status = 'lose';
//       if (bet.chosenSide === resultSide) {
//         status = 'win';
//         user.balance += bet.betAmount * 2;
//         await user.save();
//       }

//       bet.status = status;
//       bet.resultSide = resultSide;
//       await bet.save();
//     }

//     await TossResult.create({ winningSide: resultSide });
//     resetBets();

//     return tossResult;
//   } catch (error) {
//     console.error('Error in declareTossResultFunction:', error);
//     return { result: null, error: true };
//   }
// };





export {
  currentBets,
  placeBet,
  declareTossResultFunction,
  calculateTossResult,
  resetBets,
  setBettingStatus,
};




