module.exports = {
	clearBtns: [
		{
			type: 2,
			style: 4,
			label: 'Clear',
			custom_id: 'clear',
			emoji: { name: '🗑'}
		},
		{
			type: 2,
			style: 1,
			label: 'Cancel',
			custom_id: 'cancel',
			emoji: { name: '❌'}
		}
	],
	confBtns: [
		{
			type: 2,
			style: 3,
			label: 'Confirm',
			custom_id: 'yes',
			emoji: { name: '✅'}
		},
		{
			type: 2,
			style: 4,
			label: 'Cancel',
			custom_id: 'no',
			emoji: { name: '❌'}
		}
	],
	pageBtns: [
		{
			type: 2,
			label: "First",
			style: 1,
			custom_id: 'first'
		},
		{
			type: 2,
			label: 'Previous',
			style: 1,
			custom_id: 'prev'
		},
		{
			type: 2,
			label: 'Next',
			style: 1,
			custom_id: 'next'
		},
		{
			type: 2,
			label: 'Last',
			style: 1,
			custom_id: 'last'
		}
	],
}