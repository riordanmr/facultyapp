// Untested code to load a text file using fetch() and promises.
        // Return a promise that resolves to the text of the file.
        // ** Currently not used.
        function loadFacList() {
            var result = null;

            // URL of the text file
            var url = "faclist.txt";
            // Use fetch() to load the text file
            fetch(url)
                .then(response => {
                    // Check if the response is successful
                    if (!response.ok) {
                        alert("bad status: " + response.status);
                        throw new Error("Failed to load the text file.");
                    }
                    // Use text() to extract the text from the response
                    return response.text();
                })
                .then(text => {
                    alert("good response: " + text);
                    return text;
                })
                .catch(error => {
                    // Handle the error
                    alert("I caught an error: " + error);
                    console.error("An error occurred:", error);
                });

        }
