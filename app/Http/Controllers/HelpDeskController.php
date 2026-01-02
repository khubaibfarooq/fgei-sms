<?php
namespace App\Http\Controllers;

use App\Models\HelpDesk;
use App\Models\HelpDeskMessage;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class HelpDeskController extends Controller
{
    public function index(Request $request)
    {
        $query = HelpDesk::query();
$inst_id = session('sms_inst_id');
$type=session('type');
if($type=="School"||$type=="College")
   {$query->where('institute_id',$inst_id);}

        if ($request->search) {
            $query->where('token', 'like', '%' . $request->search . '%')->orWhere('title', 'like', '%' . $request->search . '%')->orWhere('description', 'like', '%' . $request->search . '%')->orWhere('feedback', 'like', '%' . $request->search . '%');
        }
        if ($request->status && $request->status != 'all') {
            $query->where('status', $request->status);
        }

        $helpDesk = $query->with(['user', 'institute', 'feedbackby'])->orderBy('id', 'desc')->paginate(10)->withQueryString();
if($type=="School"||$type=="College"){
        return Inertia::render('helpdesk/Index', [
            'helpDesk' => $helpDesk,
            'filters' => ['search' => $request->search ?? '', 'status' => $request->status ?? ''],
        ]);}else{
          return Inertia::render('helpdesk/Requests', [
            'helpDesk' => $helpDesk,
            'filters' => ['search' => $request->search ?? '', 'status' => $request->status ?? ''],
        ]);  
        }
    }

    public function create()
    {
        return Inertia::render('helpdesk/Form', ['helpDesk' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
'description'=>'required|string',
'attachment'=>'nullable|file',
    

    ]);
      $attachmentName = null;
        if ($request->hasFile('attachment')) {
            $attachment = $request->file('attachment');
            $extension = $attachment->getClientOriginalExtension();
            $attachmentName = time() . '-' . uniqid() . '.' . $extension;
            
            $destinationPath = public_path('assets/helpdesk_attachments');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            // Check if it's an image to optimize
            $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (in_array(strtolower($extension), $imageExtensions)) {
                (new ImageManager(new Driver()))->read($attachment->getPathname())
                    ->scale(width: 1280)
                    ->save($destinationPath . '/' . $attachmentName, quality: 60);
            } else {
                $attachment->move($destinationPath, $attachmentName);
            }

            $data['attachment'] = 'assets/helpdesk_attachments/' . $attachmentName;
        } else {
            unset($data['attachment']);
        }  
      $data['status'] = 'Pending';
      $data['user_id'] = auth()->id();
      $data['institute_id'] = session('sms_inst_id');
        HelpDesk::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Request saved successfully.');
    }   
    public function edit(HelpDesk $HelpDesk)
    {
        //dd($HelpDesk);
        return Inertia::render('helpdesk/Form', ['helpDesk' => $HelpDesk]);
    } 
    public function update(Request $request, HelpDesk $helpDesk)
{
    if (!auth()->check()) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    try {
        $data = $request->validate([
            'status' => 'required|string|in:Pending,Waiting,Resolved,Rejected',
            'feedback' => 'required|string',
        ]);

        $data['feedback_date'] = date('Y-m-d H:i:s');
        $data['feedback_by'] = auth()->id();


        $helpDesk->update($data);
  return redirect()->back()->with('success', 'Request updated successfully.');
    
    } catch (ValidationException $e) {
        return response()->json(['errors' => $e->errors()], 422);
    } catch (\Exception $e) {
        \Log::error('HelpDesk update failed: ' . $e->getMessage());
        return response()->json(['message' => 'Failed to update help desk ticket'], 409);
    }
}
    public function destroy(HelpDesk $HelpDesk)
    {
        $HelpDesk->delete();   
        return redirect()->back()->with('success', 'Request deleted successfully.');
    }

    public function fetchMessages(HelpDesk $helpDesk)
    {
        return response()->json([
            'messages' => $helpDesk->messages()->with('user')->get(),
            'ticket_owner_id' => $helpDesk->user_id,
            'ticket_owner_name' => $helpDesk->user?->name,
            'respondent_id' => $helpDesk->feedback_by,
            'respondent_name' => $helpDesk->feedbackBy?->name,
        ]);
    }

    public function sendMessage(Request $request, HelpDesk $helpDesk)
    {
        $request->validate([
            'message' => 'required_without:attachment|string|nullable',
            'attachment' => 'nullable|file|max:10240', // Max 10MB
        ]);

        $data = [
            'user_id' => auth()->id(),
            'message' => $request->message ?? '',
        ];

        if ($request->hasFile('attachment')) {
            $attachment = $request->file('attachment');
            $extension = $attachment->getClientOriginalExtension();
            $attachmentName = time() . '-' . uniqid() . '.' . $extension;
            
            $destinationPath = public_path('assets/chat_attachments');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            // Check if it's an image to optimize
            $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (in_array(strtolower($extension), $imageExtensions)) {
                (new ImageManager(new Driver()))->read($attachment->getPathname())
                    ->scale(width: 1280)
                    ->save($destinationPath . '/' . $attachmentName, quality: 60);
            } else {
                $attachment->move($destinationPath, $attachmentName);
            }

            $data['attachment'] = 'assets/chat_attachments/' . $attachmentName;
        }

        $message = $helpDesk->messages()->create($data);

        broadcast(new MessageSent($message))->toOthers();

        return response()->json($message->load('user'));
    }
}
