<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Service Unavailable</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f9fafb;
            color: #1f2937;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .container {
            background-color: white;
            padding: 3rem;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            text-align: center;
            max-width: 32rem;
            width: 100%;
            border-top: 4px solid #3b82f6;
        }
        .icon-container {
            background-color: #eff6ff;
            width: 5rem;
            height: 5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
        }
        .icon {
            color: #3b82f6;
            width: 2.5rem;
            height: 2.5rem;
        }
        h1 {
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #111827;
        }
        p {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 2rem;
            font-size: 1rem;
        }
        .loader {
            display: inline-block;
            position: relative;
            width: 64px;
            height: 64px;
        }
        .loader div {
            box-sizing: border-box;
            display: block;
            position: absolute;
            width: 40px;
            height: 40px;
            margin: 12px;
            border: 4px solid #3b82f6;
            border-radius: 50%;
            animation: loader 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
            border-color: #3b82f6 transparent transparent transparent;
        }
        .loader div:nth-child(1) { animation-delay: -0.45s; }
        .loader div:nth-child(2) { animation-delay: -0.3s; }
        .loader div:nth-child(3) { animation-delay: -0.15s; }
        @keyframes loader {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon-container">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
        </div>
        
        <h1>Under Maintenance</h1>
        <p>We are currently performing scheduled maintenance to improve our services. The system should be back online shortly. Thank you for your patience!</p>
        
        <div class="loader">
            <div></div><div></div><div></div><div></div>
        </div>
    </div>
</body>
</html>
