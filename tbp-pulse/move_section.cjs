const fs = require('fs');

const code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const match = code.match(/        \{\(allVideoTasks\.length > 0[\s\S]*?(?=        \{\/\* Clients Grid Section \*\/)/);
if(match) {
    const videoSection = match[0];
    let newCode = code.replace(videoSection, '');
    
    newCode = newCode.replace('        </div>\n      </div>\n\n      {/* Modal Personalizare Client */}', '        </div>\n\n' + videoSection + '      </div>\n\n      {/* Modal Personalizare Client */}');
    
    fs.writeFileSync('src/pages/Dashboard.tsx', newCode);
    console.log("Successfully moved section");
} else {
    console.log("Could not match video section");
}
