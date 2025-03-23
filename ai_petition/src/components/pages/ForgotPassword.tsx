import { useState } from "react";
import axios from "axios";

export default function ForgotPassword() {
    const [step, setStep] = useState(1);
    const [userEmail, setUserEmail] = useState("");
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleNext = async () => {
        if (step === 1) {
            try{
                const res = await axios.get(`http://localhost:5000/user/${userEmail}`);
                if (res.status === 200) {
                    console.log(res);
                    setUserId(res.data.id)
                    setStep(2);
                }
            } catch (err) {
                console.log(err);
            }
        }
    };

    const handleSubmit = async () => {
        try {
            const res = await axios.post(
                `http://localhost:5000/forgot/${userId}`, 
                { password },  // ✅ Send JSON body correctly
                { headers: { "Content-Type": "application/json" } } // ✅ Explicitly set content type
            );
    
            if (res.status === 200) {
                setSuccess(true);
                setStep(3);
            }
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.error || "Something went wrong");
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
                {error && <p className="text-red-500">{error}</p>}
                {step === 1 && (
                    <>
                        <h2 className="text-lg font-semibold mb-4">Enter User Email</h2>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            placeholder="User Email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                        />
                        <button onClick={handleNext} className="mt-4 bg-blue-500 text-white p-2 w-full rounded">
                            Next
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h2 className="text-lg font-semibold mb-4">Enter New Password</h2>
                        <input
                            type="password"
                            className="w-full p-2 border rounded"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button onClick={handleSubmit} className="mt-4 bg-green-500 text-white p-2 w-full rounded">
                            Submit
                        </button>
                    </>
                )}

                {step === 3 && success && (
                    <p className="text-green-500 text-center">Password updated successfully!</p>
                )}
            </div>
        </div>
    );
}
