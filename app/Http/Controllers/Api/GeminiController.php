<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiController extends Controller
{
    /**
     * Handles image-based problem scanning
     */
    public function scan(Request $request)
    {
        $request->validate(['image' => 'required|string']);

        $payload = [
            'contents' => [[
                'parts' => [
                    ['text' => 'Act as a home repair expert. Analyze this image and format your response exactly like this:
                    
                    DIAGNOSIS: [State what is broken and the likely cause in max 20 words]
                    
                    TRY THIS FIRST (DIY): [Provide 2 clear, actionable step-by-step instructions the user can safely try on their own right now to fix or mitigate the issue]
                    
                    NEED AN EXPERT? [State exactly what type of professional is needed if this task proves too difficult, and why]
                    
                    Constraint: Plain text only. Do not use asterisks, bolding, bullet points, or markdown formatting.'],
                    ['inline_data' => [
                        'mime_type' => 'image/jpeg',
                        'data' => $request->image
                    ]]
                ]
            ]]
        ];

        return $this->callGemini($payload);
    }

    /**
     * Handles text-based project planning
     */
    public function plan(Request $request)
    {
        $request->validate(['project' => 'required|string']);

        $payload = [
            'contents' => [[
                'parts' => [
                    ['text' => 'Act as an expert construction and home renovation manager. For the project: "' . $request->project . '", format your response exactly like this:
                    
                    PROJECT OVERVIEW: [Briefly summarize the scope of work in max 20 words]
                    
                    DIY PREPARATION & STEPS: [Provide 2 or 3 baseline tasks or safety steps the user can handle on their own to kick off the project safely]
                    
                    NEED AN EXPERT? [Provide 2 clear milestones or structural phases where they absolutely must hire a professional, stating the specific trade needed like Carpenter, Plumber, or Electrician]
                    
                    Constraint: Plain text only. Do not use asterisks, bolding, bullet points, or markdown formatting.']
                ]
            ]]
        ];

        return $this->callGemini($payload);
    }

    /**
     * Private helper to avoid repeating API logic
     * Default model updated to gemini-3.1-flash-lite
     */
    private function callGemini($payload, $model = 'gemini-3.1-flash-lite')
    {
        $apiKey = config('services.gemini.key') ?? env('GEMINI_API_KEY');

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'x-goog-api-key' => $apiKey,
        ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", $payload);

        Log::info('Gemini API Response: ' . $response->body());

        if ($response->failed()) {
            return response()->json([
                'error' => 'API Request Failed',
                'details' => $response->json() ?? $response->body()
            ], $response->status());
        }

        return response()->json($response->json());
    }
}