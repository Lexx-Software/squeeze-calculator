const path = require('path');
const fs = require('fs/promises');


async function main() {
    const RELATIVE_PATH = './src/components/deals-modal';
    const DESTINATION_PATH = './src/components/deals-modal/chart-component';
    let SOURCE_PATH = './src/components/deals-modal/chart-component-stub';

    try {
        await fs.lstat('./src/assets/charting_library');
        SOURCE_PATH = './src/components/deals-modal/chart-component-tradingView';
    } catch (e) {
    }

    try {
        const stats = await fs.lstat(DESTINATION_PATH)

        if (stats.isSymbolicLink()) {
            await fs.unlink(DESTINATION_PATH)
        }    
    } catch (e) {
    }

    const relativePath = path.relative(RELATIVE_PATH, SOURCE_PATH);
    await fs.symlink(relativePath, DESTINATION_PATH, 'dir');    
}

main()