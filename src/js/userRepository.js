const API = "https://3sem.dyrhoi.com/person/api/person";

async function getUsers() {
	const urlPath = `${API}/all`;
	return handleHttpErrors(await fetch(urlPath));
}

async function addUser(user) {
	const options = makeOptions("POST", user);
	return handleHttpErrors(await fetch(API, options));
}

async function deleteUser(id) {
	id = parseInt(id) || -1;

	const options = makeOptions("DELETE");
	const urlPath = `${API}/${id}`;
	return handleHttpErrors(await fetch(urlPath, options));
}

async function editUser(id, user) {
	id = parseInt(id) || -1;

	const options = makeOptions("PUT", user);
	const urlPath = `${API}/${id}`;
	return handleHttpErrors(await fetch(urlPath, options));
}

async function findUser(id) {
	id = parseInt(id) || -1;

	const urlPath = `${API}/${id}`;
	return handleHttpErrors(await fetch(urlPath));
}

function makeOptions(method, body) {
	var opts = {
		method: method,
		headers: {
			"Content-type": "application/json",
			Accept: "application/json",
		},
	};
	if (body) {
		opts.body = JSON.stringify(body);
	}
	return opts;
}

async function handleHttpErrors(res) {
	if (!res.ok) {
		const err = await res.json();
		//console.log(err); // For debugging...
		throw err;
	}
	return res.json();
}

export { getUsers, addUser, deleteUser, editUser, findUser };
