import { useState, useEffect } from "react";
import { useGetMe, useGetUser, useUpdateUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, User as UserIcon, Save, Calendar, Activity } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const { data: me } = useGetMe();
  const userId = me?.id;
  
  const { data: profile, isLoading } = useGetUser(userId || 0, { query: { enabled: !!userId } });
  const updateMutation = useUpdateUser();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.name || "");
      setAge(me.age?.toString() || "");
    }
  }, [me]);

  const handleSave = () => {
    if (!userId) return;
    updateMutation.mutate(
      { userId, data: { name, age: age ? parseInt(age) : undefined } },
      {
        onSuccess: () => {
          toast.success("Profile updated successfully");
          setIsEditing(false);
        },
        onError: () => toast.error("Failed to update profile")
      }
    );
  };

  if (isLoading || !profile || !me) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider mb-8">Subject Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column - ID Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
            
            <Avatar className="w-32 h-32 mx-auto border-4 border-black ring-2 ring-primary/30 mb-4 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <AvatarImage src={me.avatarUrl || ''} />
              <AvatarFallback className="bg-black text-primary font-display text-4xl">
                {me.name.substring(0,2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <h2 className="text-2xl font-bold text-white">{me.name}</h2>
            <div className="text-sm font-mono text-muted-foreground mt-1 mb-4">ID: {me.id.toString().padStart(6, '0')}</div>
            
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-widest font-bold text-primary mb-6">
              {profile.iqLevel?.replace('_', ' ') || 'Unclassified'}
            </div>

            <div className="grid grid-cols-2 gap-2 text-left border-t border-white/10 pt-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Joined</div>
                <div className="font-mono text-xs text-white">{format(new Date(me.createdAt), 'MMM yyyy')}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</div>
                <div className="font-mono text-xs text-emerald-400">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Details & Stats */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="glass p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <UserIcon className="w-4 h-4" /> Personal Details
              </h3>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-xs">
                  EDIT
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Subject Name</Label>
                  <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    disabled={!isEditing}
                    className="bg-black/50 border-white/10 disabled:opacity-100 disabled:text-white font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Age</Label>
                  <Input 
                    type="number"
                    value={age} 
                    onChange={e => setAge(e.target.value)} 
                    disabled={!isEditing}
                    className="bg-black/50 border-white/10 disabled:opacity-100 disabled:text-white font-mono"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Email</Label>
                  <Input 
                    value={me.email} 
                    disabled 
                    className="bg-black/50 border-white/10 opacity-50 font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Identity verified. Email cannot be changed.</p>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-primary text-primary-foreground">
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-6 rounded-2xl border border-white/10">
              <Activity className="w-6 h-6 text-secondary mb-4" />
              <div className="text-4xl font-display font-bold text-white mb-1">{profile.totalTests}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Total Assessments</div>
            </div>
            <div className="glass p-6 rounded-2xl border border-white/10">
              <Calendar className="w-6 h-6 text-accent mb-4" />
              <div className="text-4xl font-display font-bold text-white mb-1">{profile.streak}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Day Streak</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
