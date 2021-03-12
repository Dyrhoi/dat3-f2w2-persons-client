/**
 *
 * Styles and stuff...
 *
 */
import "halfmoon/css/halfmoon-variables.min.css";
import halfmoon from "halfmoon";
import "./css/style.css";

/**
 *
 *
 *
 */
import * as userRepository from "./js/userRepository";

// Initialize Halfmoon
halfmoon.onDOMContentLoaded();

function userRow(user) {
	return `
    <tr>
        <td>${user.id}</td>
        <td>${user.fName}</td>
        <td>${user.lName}</td>
        <td>${user.phone}</td>
        <td>${user.street}</td>
        <td>${user.city}</td>
        <td>${user.zip}</td>
        <td>
            <div class="text-nowrap">
                <a class="btn prompt-edit" data-id="${user.id}" type="button">Edit</a>
                <a data-id="${user.id}" class="btn btn-danger ml-10 prompt-delete" type="button">Delete</a>
            </div>
        </td>
    </tr>
    `;
}

async function displayUsers() {
	const $utc = document.getElementById("users_table").querySelector("tbody");
	try {
		const users = await userRepository.getUsers();
		const rows = Array.isArray(users.all) ? users.all.map((user) => userRow(user)).join("") : "<tr><td>No users found...</td></tr>";
		$utc.innerHTML = rows;
	} catch (err) {
		displayError(err);
	}
}

// Initial load, display our users.
displayUsers();

/**
 *
 * Repository and Event Workings.
 *
 */

// All our events do almost the exact same thing...
// Builds a json object from formdata and sends to our user repository.
// Reset the form and refresh the user table -- except if an error happened.
// So having one function to manage all events seems more logical here.
async function handleFormEvent(event, $form, requestType) {
	event.preventDefault();
	const user = formDataToJSON(new FormData($form));

	// Disable submit button to prevent accidental double request.
	const $submit = $form.querySelector("input[type='submit']");
	$submit.disabled = true;

	try {
		// Our 4 types of requests...
		let userResponse;
		let pastTense; // Just for nicer UI
		switch (requestType) {
			case "create":
				userResponse = await userRepository.addUser(user);
				pastTense = "created";
				break;
			case "edit":
				userResponse = await userRepository.editUser(user.id, user);
				pastTense = "edited";
				break;
			case "delete":
				pastTense = "deleted";
				userResponse = await userRepository.deleteUser(user.id, user);
				break;
			default:
				throw { code: 400, message: "Unsupported Action, please contact an administrator if this problem persists..." };
		}
		$form.reset();
		closeModals();
		displaySuccess(`User #${userResponse.id} ${userResponse.fName} ${userResponse.lName} was successfully ${pastTense}.`);
	} catch (err) {
		displayError(err);
	}
	await displayUsers();
	// Finish loading.
	$submit.disabled = false;
}

const $fCreateUser = document.getElementById("f_create_user");
$fCreateUser.onsubmit = (e) => handleFormEvent(e, $fCreateUser, "create");

const $fEditUser = document.getElementById("f_edit_user");
$fEditUser.onsubmit = (e) => handleFormEvent(e, $fEditUser, "edit");

const $fDeleteUser = document.getElementById("f_delete_user");
$fDeleteUser.onsubmit = (e) => handleFormEvent(e, $fDeleteUser, "delete");

document.getElementById("refresh_users").onclick = (e) => {
	e.preventDefault();
	displayUsers();
};

/**
 *
 * Our prompts...
 *
 */

// This will save us boilerplate code, as both prompts do almost the same thing.
async function promptDynamicUserModal($target, requestType) {
	const id = $target.dataset.id;

	// Update our Edit Modal...
	const $modal = document.getElementById(`m_${requestType}_user`);
	$modal.querySelector(".modal-title span").innerText = id;

	try {
		const user = await userRepository.findUser(id);

		// Populate our form with data we already know
		for (const [key, value] of Object.entries(user)) {
			const input = $modal.querySelector(`form input[name='${key}']`);
			if (!input) return;
			input.value = value;
			// We don't want the use to edit our data (even though it wouldn't do anything...)
			if (requestType == "delete") {
				input.readOnly = true;
				input.classList.add("disabled");
			}
		}

		// Open our modal.
		window.location.hash = `m_${requestType}_user`;
	} catch (err) {
		// If we can't find the user, it was probably deleted by someone else... just refresh the user table..?
		displayError(err);
		displayUsers();
	}
}
// Our edit and delete prompts will be dynamically added, so we have to listen on our entire document.
document.addEventListener("click", async (e) => {
	const $target = e.target;

	// Fire our edit prompt
	if ($target.classList.contains("prompt-edit") || $target.classList.contains("prompt-delete")) {
		e.preventDefault();
		promptDynamicUserModal($target, $target.classList.contains("prompt-edit") ? "edit" : "delete");
	}
});
/**
 *
 * Notifications
 *
 */
function displayError(error) {
	halfmoon.initStickyAlert({
		content: error.message || "Unknown error ocurred...",
		title: `Error - ${error.code || ""}`,
		alertType: "alert-danger",
		fillType: "filled",
	});
}

function displaySuccess(msg) {
	halfmoon.initStickyAlert({
		content: msg || "",
		title: "Success.",
		alertType: "alert-success",
		fillType: "filled",
	});
}

/**
 *
 *
 * Other global functions we need.
 *
 */

// Why doesn't halfmoon have a good way to just close all modals!?
function closeModals() {
	window.location.hash = "#";
}
function formDataToJSON(formData) {
	let object = {};
	formData.forEach((value, key) => {
		// Reflect.has in favor of: object.hasOwnProperty(key)
		if (!Reflect.has(object, key)) {
			object[key] = value;
			return;
		}
		if (!Array.isArray(object[key])) {
			object[key] = [object[key]];
		}
		object[key].push(value);
	});
	return object;
}
