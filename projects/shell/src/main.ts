console.log('Shell main.ts executing...');
import('./bootstrap')
	.catch(err => {
		console.error('Shell bootstrap error:', err);
	});
