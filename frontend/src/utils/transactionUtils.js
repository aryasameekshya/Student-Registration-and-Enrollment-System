export const generateTransactionHistory = (profile) => {
    const jeeNo = String(profile.jee_app_no || '');
    const prefix = jeeNo.substring(0, 2);
    const yearPart = parseInt(prefix);
    const startYear = (!isNaN(yearPart) && yearPart >= 22 && yearPart <= 30) ? parseInt("20" + prefix) : 2026;
    console.log(`[DEBUG] JEE: ${jeeNo}, Prefix: ${prefix}, Calculated StartYear: ${startYear}`);
    
    const today = new Date();
    const successCutoff = new Date(2026, 2, 1); // March 1st, 2026
    const txns = [];
    
    // All students use the April cycle (Month 3)
    const startMonth = 3; 
    
    // Add Admission Fee
    const admissionDate = new Date(startYear, startMonth, 20, 10, 30);
    if (admissionDate <= today) {
        const isSuccess = admissionDate < successCutoff;
        txns.push({ 
            date: admissionDate.toISOString().replace('T', ' ').substring(0, 19), 
            sem: '1', 
            regn_fee: '5000.00', 
            hostel_fee: '0.00', 
            fine: '0.00', 
            total: '5000.00', 
            trans_amount: '5000.00', 
            status: isSuccess ? 'Success' : 'Pending', 
            message: isSuccess ? 'Admission Fee Paid Successfully' : 'Admission Fee Processed', 
            ref_no: `ADM${startYear}7821` 
        });
    }

    // Generate Semester-wise fees
    let currentSem = 1;
    let semDate = new Date(startYear, startMonth, 22, 14, 22);
    
    while (semDate <= today && currentSem <= 8) {
        // Registration Fee
        const isRegnSuccess = semDate < successCutoff;
        txns.push({ 
            date: semDate.toISOString().replace('T', ' ').substring(0, 19), 
            sem: `${currentSem}`, 
            regn_fee: '1500.00', 
            hostel_fee: '0.00', 
            fine: '0.00', 
            total: '1500.00', 
            trans_amount: '1500.00', 
            status: isRegnSuccess ? 'Success' : 'Pending', 
            message: isRegnSuccess ? `Registration Fee (Sem ${currentSem}) Paid Successfully` : `Registration Fee (Sem ${currentSem}) Processed`, 
            ref_no: `REG${semDate.getFullYear()}${currentSem}9912` 
        });

        // Semester Fee
        const semFeeDate = new Date(semDate);
        semFeeDate.setDate(semFeeDate.getDate() + 3);
        if (semFeeDate <= today) {
            const isSemSuccess = semFeeDate < successCutoff;
            txns.push({ 
                date: semFeeDate.toISOString().replace('T', ' ').substring(0, 19), 
                sem: `${currentSem}`, 
                regn_fee: '25000.00', 
                hostel_fee: currentSem === 1 ? '15000.00' : '0.00', 
                fine: '0.00', 
                total: currentSem === 1 ? '40000.00' : '25000.00', 
                trans_amount: currentSem === 1 ? '40000.00' : '25000.00', 
                status: isSemSuccess ? 'Success' : 'Pending', 
                message: isSemSuccess ? `${currentSem}${currentSem === 1 ? 'st' : currentSem === 2 ? 'nd' : currentSem === 3 ? 'rd' : 'th'} Semester Fee Paid Successfully` : `${currentSem}${currentSem === 1 ? 'st' : currentSem === 2 ? 'nd' : currentSem === 3 ? 'rd' : 'th'} Semester Fee Processed`, 
                ref_no: `SEM${semFeeDate.getFullYear()}${currentSem}0011` 
            });
        }

        currentSem++;
        semDate.setMonth(semDate.getMonth() + 6);
    }
    
    return txns;
};
