
let fileInput$=document.querySelector("input[type='file']");
let regexMenu$=document.querySelector("select");
let regexName$= document.querySelector("input[data-object-field='name']")
let regexPattern$= document.querySelector("textarea")

let regexOptions=[{name:"Name",regex:"string"}];
let regexOptionsJSON = localStorage.getItem("regexOptions") ??  '[]'
regexOptions = JSON.parse(regexOptionsJSON);
refreshRegexMenu();
let CurrentData;
function refreshRegexMenu(){
    regexMenu$.replaceChildren();
    let defaultOption = document.createElement("option");
    defaultOption.selected=true;
    defaultOption.disabled=true;
    defaultOption.textContent="Select Regex";
    regexMenu$.append(defaultOption);
    for(const regexOpt of regexOptions){
        let option = document.createElement("option");
        option.textContent=regexOpt.name;
        option.dataset.regex=regexOpt.regex;
        regexMenu$.append(option);
    }
}

regexMenu$.addEventListener("input",(ev)=>{
    let selectedOption = ev.target.selectedOptions[0];
    regexName$.value=selectedOption.textContent;
    regexPattern$.value=selectedOption.dataset.regex;
    localStorage.setItem("regexOptions",JSON.stringify(regexOptions));
    refreshRegexMenu();
})

document.querySelector("button[data-button-function='save']").addEventListener("click",(ev)=>{
    let name = regexName$.value;
    let regex = regexPattern$.value;
    regexOptions.push({name,regex});
    localStorage.setItem("regexOptions",JSON.stringify(regexOptions));
    refreshRegexMenu();
})
document.querySelector("button[data-button-function='remove']").addEventListener("click",(ev)=>{
    let name = regexName$.value;
    regexOptions = regexOptions.filter((obj)=>(obj.name!==name));
    localStorage.setItem("regexOptions",JSON.stringify(regexOptions));
    refreshRegexMenu();
})

regexPattern$.addEventListener("input",(ev)=>{
    let name = regexName$.value;
    let pattern = ev.target.value;
    for(const saveRegex of regexOptions){
        if(saveRegex.name===name) saveRegex.regex=pattern;
    }
})
fileInput$.addEventListener("change",(ev)=>loadFile());
document.querySelector("button[data-button-function='run']").addEventListener("click",()=>loadFile());

document.querySelector("button[data-button-function='download']").addEventListener("click",()=>{
        let title = `CSV ${document.querySelector("input[data-object-field='csvName']").value}.csv`;
        let data = Array.from(CurrentData);
        if( document.querySelector("input[type='checkbox']").checked){ 
            let paddedHeaderRow =[]
            for(let i=0;i<CurrentData.headings.length;i++){
                paddedHeaderRow.push(CurrentData.headings[i].padEnd(data[0][i].length));
            }
            data.unshift(paddedHeaderRow);
            }
        let csv = csvMaker(data);
        downloadFile(csv,title);
    });



function loadFile(){
    console.log("go")
    let file = fileInput$.files[0];
    let fr = new FileReader();
    fr.addEventListener("load",(ev)=>parseFile(ev.target.result))
    fr.readAsText(file);
}

function parseFile(text){
    let regexString = String(regexPattern$.value).trim().replace(/\n/g,"");
    let regex = new RegExp(regexString,"gm");
    let matchResult = text.matchAll(regex);
    let resultArray = Array.from(matchResult);
    if(resultArray.length===0){
        let noResult= [""];
        noResult.headings=["No Result"]
         displayData(noResult);
         throw new Error("No Match")}
    let niceData=[]
     niceData.headings=[];
    
     for(const heading in resultArray[0].groups){
        niceData.headings.push(heading);
     }
     
    for(const result of resultArray){
        let row=[]
        for(const groupName of niceData.headings){
            row.push(result.groups[groupName]);
        }
        niceData.push(row);
    }
    displayData(niceData);
    CurrentData=niceData;
}

function displayData(niceData){
    let table$=document.querySelector("table");
    table$.replaceChildren();
    let headArray=niceData.headings;
    let head$=document.createElement("thead");
    let headRow$ = document.createElement("tr");
    head$.append(headRow$);
    table$.append(headRow$);
    for(const header of headArray){
        let headCell = document.createElement("th");
        headCell.scope='col';
        headCell.textContent=header;
        headRow$.append(headCell);
    }
    let tableBody$=document.createElement("tbody");

    for(const row of niceData){
        let tableRow$=document.createElement("tr");
        for(const value of row){
            let tableCell$ = document.createElement("td");
            tableCell$.textContent = value;
            tableRow$.append(tableCell$);
        }
        tableBody$.append(tableRow$)
    }
    table$.append(tableBody$);

}

function csvMaker(arr=[]){
    let data ='';
    for(const row of arr){
        for(let col of row){
            col = (col) ? col:"";
           data += `"${col.toString().replace(/"/g,'""')}\t",`
            //   data += `${col.toString().replace(/"/g,'""')},` // comp creator appears not to like escaped values
        }
        data=data.slice(0,-1)
        data+="\r\n";
    }
    let blob = new Blob([data],{type:"data:text/csv;charset=utf-8,"})
    return blob
}

function downloadFile(file,name="Unnamed File"){
    const dataURL = URL.createObjectURL(file)
    const link = document.createElement('a');
          link.href= dataURL;
          link.setAttribute("download", name);
          link.click();
          console.log("Tried to download: ",name,file,dataURL);
  }