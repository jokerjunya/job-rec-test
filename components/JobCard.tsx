'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Job } from '@/lib/schema';
import { Badge } from '@/components/ui/badge';
import { Briefcase, TrendingUp, MapPin, Building2, DollarSign, Clock } from 'lucide-react';

interface JobCardProps {
  job: Job;
  className?: string;
}

export function JobCard({ job, className }: JobCardProps) {
  const requirements = job.job_requirements.split(', ');
  const displayTitle = job.job_title || `Job #${job.job_id}`;

  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-5 w-5 text-primary flex-shrink-0" />
              <CardTitle className="text-xl font-bold line-clamp-2">
                {displayTitle}
              </CardTitle>
            </div>
            {job.company_name && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                <Building2 className="h-4 w-4" />
                <span>{job.company_name}</span>
              </div>
            )}
            {job.location && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
            )}
          </div>
          {job.recommended === 1 && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 animate-pulse flex-shrink-0">
              <TrendingUp className="h-3 w-3 mr-1" />
              推奨
            </Badge>
          )}
        </div>
        {job.match_score && (
          <CardDescription className="mt-3">
            <span className="text-sm font-medium text-muted-foreground">
              マッチスコア: <span className="text-primary font-bold">{(job.match_score * 100).toFixed(1)}%</span>
            </span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* 給与・雇用形態情報 */}
          {(job.salary_range || job.employment_type || job.experience_level) && (
            <div className="flex flex-wrap gap-2 items-center">
              {job.salary_range && (
                <Badge variant="outline" className="text-xs">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {job.salary_range}
                </Badge>
              )}
              {job.employment_type && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {job.employment_type}
                </Badge>
              )}
              {job.experience_level && (
                <Badge variant="outline" className="text-xs">
                  {job.experience_level}
                </Badge>
              )}
            </div>
          )}
          
          {/* 必要なスキル */}
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

          {/* 求人説明 */}
          {job.job_description && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-foreground">説明:</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {job.job_description}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

