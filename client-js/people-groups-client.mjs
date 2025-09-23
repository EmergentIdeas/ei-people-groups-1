import ListView from '@webhandle/drag-sortable-list'

let elList1 = document.querySelector('.people-groups-list-edit .people')
let list1 = new ListView({
	el: elList1
	, mobileHandleSelector: '.move'
})
list1.isExternalDrop = () => false
list1.render()

let emitter = list1.emitter
emitter.on('list-change', (evt) => {
	let items = elList1.querySelectorAll('li')
	var count = 0;
	var order = {}
	items.forEach((item) => {
		order[item.getAttribute('data-id')] = count++
	})

	fetch(elList1.getAttribute('data-sort-url'), {
		method: 'POST'
		, body: JSON.stringify(order)
		, headers: {
			'Content-Type': 'application/json'
		}
	})
})

// import UploadableImage from "ei-pic-browser/uploadable-image"

// document.querySelectorAll('.person-edit-form input[type=text].picture-input-field').forEach(function (item) {
// 	new UploadableImage(item)
// })