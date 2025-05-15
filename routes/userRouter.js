import express from 'express';
import {
  allrequests,
  allwithdrawreq,
  approveRequest,
  fetchdetails,
  getAllUsers,
  getUserHistory,
  loginUser,
  onlyrequests,
  onlywithdrawrequests,
  registerUser,
  rejectRequest,
  requestAddMoney,
  withdraw,
  withdrawApproveRequest,
  withdrawRejectRequest,
} from '../controllers/userController.js';
import upload from '../middleware/upload.js';


const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/fetchuser', fetchdetails);
userRouter.post('/history', getUserHistory);
userRouter.get('/getuser', getAllUsers);
userRouter.get('/allrequest', allrequests);
userRouter.get('/onlyrequest', onlyrequests );
userRouter.post('/withdraw', withdraw);
userRouter.get('/withdrawrequest',allwithdrawreq);
userRouter.get('/onlywithdrawrequest',onlywithdrawrequests);

// Add money request with image upload
userRouter.post('/add-money', upload.single('screenshot'), requestAddMoney);

//Approve Request Route
userRouter.put('/approve-request/:id', approveRequest);
userRouter.put('/withdraw-approve-request/:id', withdrawApproveRequest);

// Reject request route
userRouter.put('/reject-request/:id', rejectRequest);
userRouter.put('/withdraw-reject-request/:id',withdrawRejectRequest);


export default userRouter;
