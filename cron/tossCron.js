import cron from 'node-cron';
import axios from 'axios';

const declareTossJob = (io) => {
  cron.schedule('*/30 * * * * *', async () => {
    try {
      console.log('⏰ Cron: Declaring toss Result');
      
      const res = await axios.post('http://localhost:4000/api/games/declare', {
        system: true
      });

      console.log('🎯 Toss Result:', res.data);

      // Emit toss result to all connected clients via WebSocket
      io.emit('tossResult', res.data);

    } catch (error) {
      console.error('❌ Toss declaration failed:', error?.response?.data || error.message);
    }
  });
};

export default declareTossJob;
