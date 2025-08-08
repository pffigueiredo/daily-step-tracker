import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
// Utility functions to replace date-fns
const formatDate = (date: Date, formatStr: string): string => {
  if (formatStr === 'yyyy-MM-dd') {
    return date.toISOString().split('T')[0];
  }
  if (formatStr === 'PPP') {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  if (formatStr === 'EEEE, MMM dd, yyyy') {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
  }
  if (formatStr === 'MMM dd, yyyy') {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
  }
  if (formatStr === 'MMM dd') {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit' 
    });
  }
  if (formatStr === 'h:mm a') {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  return date.toLocaleDateString();
};

const subDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

const startOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day;
  return new Date(result.setDate(diff));
};

const endOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + 6;
  return new Date(result.setDate(diff));
};
import { CalendarIcon, TrendingUp, Target, Activity } from 'lucide-react';
// Using type-only imports for better TypeScript compliance
import type { DailySteps, CreateDailyStepsInput, GetUserStepsInput } from '../../server/src/schema';

function App() {
  // State management
  const [stepsRecords, setStepsRecords] = useState<DailySteps[]>([]);
  const [currentSteps, setCurrentSteps] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user] = useState('user123'); // Hardcoded user for demo - in real app would come from auth
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Load user's steps history
  const loadStepsHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const input: GetUserStepsInput = {
        user_id: user,
        start_date: formatDate(subDays(new Date(), 30), 'yyyy-MM-dd'), // Last 30 days
        end_date: formatDate(new Date(), 'yyyy-MM-dd')
      };
      const result = await trpc.getUserSteps.query(input);
      setStepsRecords(result);
    } catch (error) {
      console.error('Failed to load steps history:', error);
      setMessage({ type: 'error', text: 'Failed to load steps history' });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load current date's steps when date changes
  const loadStepsForDate = useCallback(async () => {
    try {
      const result = await trpc.getStepsByDate.query({
        user_id: user,
        date: formatDate(selectedDate, 'yyyy-MM-dd')
      });
      setCurrentSteps(result?.steps?.toString() || '');
    } catch (error) {
      console.error('Failed to load steps for date:', error);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    loadStepsHistory();
  }, [loadStepsHistory]);

  useEffect(() => {
    loadStepsForDate();
  }, [loadStepsForDate]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSteps || parseInt(currentSteps) < 0) {
      setMessage({ type: 'error', text: 'Please enter a valid number of steps' });
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateDailyStepsInput = {
        user_id: user,
        date: formatDate(selectedDate, 'yyyy-MM-dd'),
        steps: parseInt(currentSteps)
      };
      
      const result = await trpc.createDailySteps.mutate(input);
      
      // Update the local state
      setStepsRecords((prev: DailySteps[]) => {
        const existingIndex = prev.findIndex(record => 
          formatDate(record.date, 'yyyy-MM-dd') === formatDate(result.date, 'yyyy-MM-dd')
        );
        
        if (existingIndex >= 0) {
          // Update existing record
          const updated = [...prev];
          updated[existingIndex] = result;
          return updated;
        } else {
          // Add new record and sort by date
          return [...prev, result].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        }
      });
      
      setMessage({ type: 'success', text: `Successfully recorded ${currentSteps} steps for ${formatDate(selectedDate, 'MMM dd, yyyy')}!` });
    } catch (error) {
      console.error('Failed to record steps:', error);
      setMessage({ type: 'error', text: 'Failed to record steps. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate statistics
  const weeklyTotal = stepsRecords
    .filter(record => {
      const recordDate = new Date(record.date);
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());
      return recordDate >= weekStart && recordDate <= weekEnd;
    })
    .reduce((sum, record) => sum + record.steps, 0);

  const averageDaily = stepsRecords.length > 0 
    ? Math.round(stepsRecords.reduce((sum, record) => sum + record.steps, 0) / stepsRecords.length)
    : 0;

  const highestDay = stepsRecords.length > 0 
    ? Math.max(...stepsRecords.map(record => record.steps))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Activity className="text-blue-600" size={40} />
            Daily Steps Tracker 👟
          </h1>
          <p className="text-gray-600">Track your daily steps and monitor your progress!</p>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <Alert className={`${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'} transition-all duration-300`}>
            <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-800">{weeklyTotal.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">steps</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Target className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Daily Average</p>
                  <p className="text-2xl font-bold text-gray-800">{averageDaily.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">steps</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Activity className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Personal Best</p>
                  <p className="text-2xl font-bold text-gray-800">{highestDay.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">steps</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Steps Input Form */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Record Your Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Select Date</label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDate(selectedDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date: Date | undefined) => {
                          if (date) {
                            setSelectedDate(date);
                            setCalendarOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Number of Steps</label>
                  <Input
                    type="number"
                    placeholder="Enter your steps"
                    value={currentSteps}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentSteps(e.target.value)}
                    min="0"
                    className="text-lg"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || !currentSteps} 
                className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                size="lg"
              >
                {isSubmitting ? '🔄 Recording...' : '✅ Record Steps'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Steps History */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Steps History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Loading your steps history...</p>
              </div>
            ) : stepsRecords.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🚶‍♂️</div>
                <p className="text-gray-600 mb-2">No steps recorded yet!</p>
                <p className="text-gray-500 text-sm">Start by recording your first daily steps above.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {stepsRecords.map((record: DailySteps) => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {record.steps >= 10000 ? '🔥' : record.steps >= 7000 ? '⭐' : record.steps >= 5000 ? '👍' : '🚶'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {formatDate(new Date(record.date), 'EEEE, MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-gray-600">
                          Recorded {formatDate(new Date(record.updated_at), 'MMM dd')} at {formatDate(new Date(record.updated_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">
                        {record.steps.toLocaleString()}
                      </p>
                      <Badge 
                        variant={record.steps >= 10000 ? "default" : record.steps >= 7000 ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {record.steps >= 10000 ? 'Goal Achieved!' : 
                         record.steps >= 7000 ? 'Great Job!' : 
                         record.steps >= 5000 ? 'Keep Going!' : 'Start Strong!'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">
            💡 Tip: Aim for 10,000 steps daily for optimal health benefits!
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;