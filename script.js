const promptBox = document.getElementById('prompt')

const generateBtn = document.getElementById('generateBtn')
const explainBtn = document.getElementById('explainBtn')
const examplesBtn = document.getElementById('examplesBtn')
const examplesList = document.getElementById("examplesList");

const codeOutput = document.getElementById('codeOutput');
const runBtn = document.getElementById('runBtn');
const debugBtn = document.getElementById('debugBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const shareBtn = document.getElementById('shareBtn')

const result = document.getElementById('result');

generateBtn.addEventListener('click', generateCode);
explainBtn.addEventListener('click', explainCode);
examplesBtn.addEventListener('click',examplesCode);
runBtn.addEventListener('click',runCode);
debugBtn.addEventListener('click',debugCode);
downloadBtn.addEventListener('click',downloadCode);
clearBtn.addEventListener('click',clearCode);
shareBtn.addEventListener('click',shareCode);


async function generateCode(event) {
    generateBtn.disabled = true
    //read user prompt
    const userPrompt = promptBox.value.trim()
    if (!userPrompt) {
        alert('Please enter a prompt first!')
        generateBtn.disabled = false;
        return
    }
    //show loading text
    codeOutput.value = "Pls wait generating code..."
    //call llm
    const response = await callLLM("generate", userPrompt)
    //enter content to editor
    codeOutput.value = response;
    generateBtn.disabled = false;
}

async function explainCode(event) {
    const code = codeOutput.value.trim()
    if (!code) {
        alert("Please enter code first to explain!");
        return;
    }
    const originalCodeValue = codeOutput.value;
    promptBox.value = "Generating Explanation..."
    const response = await callLLM('explain', originalCodeValue);
    promptBox.value = response
}


async function examplesCode(event){
    const topic = promptBox.value.trim()
    if(!topic){
        alert('Please enter a topic or hint to get examples!');
        return;
    }
    examplesList.innerHTML = "Loading suggestions...";
    const response = await callLLM('examples',topic);

    // Convert result into clickable suggestions
    const suggestions = response
        .split("\n")
        .filter(line => line.trim().length > 0);

    examplesList.innerHTML = "";

    suggestions.forEach(suggestion => {
        const item = document.createElement("div");
        item.className = "example-item";
        item.innerText = suggestion.replace(/^\d+\.\s*/, "");  
        
        // Clicking on example inserts it into the prompt input
        item.addEventListener("click", () => {
            promptBox.value = item.innerText;
            examplesList.innerHTML = "";
        });

        examplesList.appendChild(item);
    });
}

async function runCode(event) {
    const code = codeOutput.value.trim()
    result.textContent = "";
    if(!code){
        alert('Please enter the code first!')
        return
    }
    result.textContent = "Generating Output..."
    const response = await callLLM('run',codeOutput.value)
    result.textContent = response
}

async function debugCode(event){
    const code = codeOutput.value.trim()
    result.textContent = ""
    if(!code){
        alert('There is no code to debug.')
        return
    }
    result.textContent = 'Debugging...'
    const response = await callLLM('debug',codeOutput.value)
    result.textContent = response
}

function downloadCode(event){
    const code = codeOutput.value
    if(!code.trim()){
        alert('Nothing to Download.')
        return
    }
    // Create a Blob (file-like object)
    const blob = new Blob([code], { type: "text/plain" });

    // Create a temporary download link
    const url = URL.createObjectURL(blob);

    const fileName = "code.txt"; // You can change to code.js or code.html

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;

    // Trigger download
    a.click();

    // Cleanup
    URL.revokeObjectURL(url);
}

function clearCode(event){
    codeOutput.value = ""
    result.textContent = ""
}

async function shareCode(event){
    const code = codeOutput.value;

    if (!code.trim()) {
        alert("Nothing to share!");
        return;
    }
    // Encode code safely for URL
    const encoded = encodeURIComponent(code);

    // Create shareable link
    // const lang = langSelect.value;
    const shareURL = `${window.location.origin}?code=${encoded}`;
    try {
        // Copy to clipboard
        await navigator.clipboard.writeText(shareURL);
        alert("Shareable link copied to clipboard!");
    } catch (err) {
        alert("Failed to copy link: " + err.message);
    }
}


async function callLLM(promptType, prompt) {
    try {
        const response = await fetch("/api/gemini", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ promptType, prompt }),
        });

        const data = await response.json();
        return data.response || "No response returned";
    } catch (error) {
        return "Error: " + error.message;
    }
}


// Auto-fill code from URL on load
window.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const codeFromURL = params.get("code");

    if (codeFromURL) {
        const decoded = decodeURIComponent(codeFromURL);
        codeOutput.value = decoded;
    }
});
