'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Job } from '@/lib/schema';
import { Badge } from '@/components/ui/badge';
import { Briefcase, TrendingUp } from 'lucide-react';

interface JobCardProps {
  job: Job;
  className?: string;
}

export function JobCard({ job, className }: JobCardProps) {
  const requirements = job.job_requirements.split(', ');

  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">
              Job #{job.job_id}
            </CardTitle>
          </div>
          {job.recommended === 1 && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 animate-pulse">
              <TrendingUp className="h-3 w-3 mr-1" />
              推奨
            </Badge>
          )}
        </div>
        {job.match_score && (
          <CardDescription className="mt-2">
            <span className="text-sm font-medium text-muted-foreground">
              マッチスコア: <span className="text-primary font-bold">{(job.match_score * 100).toFixed(1)}%</span>
            </span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">必要なスキル:</h3>
            <div className="flex flex-wrap gap-2">
              {requirements.map((skill, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="text-xs py-1 px-2 hover:bg-secondary/80 transition-colors"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

