<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // GET /api/users
    public function index()
    {
        return response()->json(User::select('user_id','name','email','isRepairer','created_at')->get());
    }

    // POST /api/users
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'email' => ['required','email','max:255','unique:users,email'],
            'password' => ['required','string','min:6'],
            'isRepairer' => ['boolean'],
        ]);

        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);
        return response()->json($user, 201);
    }

    // PUT /api/users/{id}
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes','string','max:255'],
            'email' => ['sometimes','email','max:255','unique:users,email,'.$user->user_id.',user_id'],
            'password' => ['sometimes','string','min:6'],
            'isRepairer' => ['sometimes','boolean'],
        ]);

        if(isset($data['password'])) $data['password'] = Hash::make($data['password']);

        $user->update($data);
        return response()->json($user);
    }

    // DELETE /api/users/{id}
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message'=>'deleted']);
    }
}
