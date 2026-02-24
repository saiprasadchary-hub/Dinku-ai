const fs = require('fs');
const path = require('path');
const cssPath = path.join(process.cwd(), 'style.css');

try {
    let css = fs.readFileSync(cssPath, 'utf8');

    // Find the last known good selector
    const validEndMarker = '.slider-value {';
    const lastIndex = css.lastIndexOf(validEndMarker);

    if (lastIndex !== -1) {
        // Find the closing brace of the media query after this block
        // The structure is: .slider-value { text-align: center; } }
        // So we need to find the second '}' after the marker

        let firstBrace = css.indexOf('}', lastIndex);
        let secondBrace = css.indexOf('}', firstBrace + 1);

        if (secondBrace !== -1) {
            // Cut off everything after the second brace (which closes the media query)
            css = css.substring(0, secondBrace + 1);

            // Append the new CSS
            const newCSS = `\n
/* ================================
   PREVIEW MODAL IMPROVEMENTS
   ================================ */
.preview-modal-content {
    background: #1e1e1e;
    width: 90vw;
    height: 90vh;
    max-width: 1400px;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 50px 100px rgba(0,0,0,0.5);
    animation: modalScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.preview-body {
    flex: 1;
    background: #ffffff;
    width: 100%;
    position: relative;
    overflow: hidden;
    border-radius: 0 0 16px 16px; 
}

#preview-frame {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
    background: #ffffff;
}
`;
            fs.writeFileSync(cssPath, css + newCSS, 'utf8');
            console.log('Successfully fixed style.css');
        } else {
            console.error('Could not find end of media query');
            process.exit(1);
        }
    } else {
        console.error('Could not find valid end marker');
        process.exit(1);
    }
} catch (e) {
    console.error('Error fixing file:', e);
    process.exit(1);
}
