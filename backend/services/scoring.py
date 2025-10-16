from server import db
from typing import Dict, Any


class ScoringService:
    def __init__(self):
        self.weights = {
            "skills": 0.40,
            "experience": 0.20,
            "location": 0.10,
            "behavioral": 0.20,
            "availability": 0.10
        }
    
    async def calculate_score(self, application_id: str) -> Dict[str, Any]:
        app = await db.applications.find_one({"id": application_id})
        if not app:
            raise ValueError("Application not found")
        
        job = await db.jobs.find_one({"id": app["job_id"]})
        candidate = await db.candidates.find_one({"id": app["candidate_id"]})
        
        skills_score = await self._calculate_skills_score(app, job, candidate)
        experience_score = await self._calculate_experience_score(app, job, candidate)
        location_score = await self._calculate_location_score(job, candidate)
        behavioral_score = await self._calculate_behavioral_score(app, job)
        availability_score = await self._calculate_availability_score(job, candidate)
        
        total_score = (
            skills_score * self.weights["skills"] +
            experience_score * self.weights["experience"] +
            location_score * self.weights["location"] +
            behavioral_score * self.weights["behavioral"] +
            availability_score * self.weights["availability"]
        )
        
        total_score = max(0, total_score)
        
        return {
            "total_score": round(total_score, 2),
            "breakdown": {
                "skills": round(skills_score, 2),
                "experience": round(experience_score, 2),
                "location": round(location_score, 2),
                "behavioral": round(behavioral_score, 2),
                "availability": round(availability_score, 2)
            }
        }
    
    async def _calculate_skills_score(self, app, job, candidate) -> float:
        required_skills = await db.job_required_skills.find({"job_id": job["id"]}).to_list(100)
        if not required_skills:
            return 100.0
        
        candidate_skills = await db.candidate_skills.find({"candidate_id": candidate["id"]}).to_list(100)
        candidate_skill_map = {cs["skill_id"]: cs for cs in candidate_skills}
        
        score = 100.0
        matched = 0
        must_have_failed = False
        
        for req in required_skills:
            if req["skill_id"] in candidate_skill_map:
                cand_skill = candidate_skill_map[req["skill_id"]]
                if cand_skill["level"] >= req["min_level"]:
                    matched += 1
                elif req["must_have"]:
                    must_have_failed = True
            elif req["must_have"]:
                must_have_failed = True
        
        if must_have_failed:
            score -= 20
        
        if required_skills:
            match_ratio = matched / len(required_skills)
            score = score * match_ratio
        
        return max(0, score)
    
    async def _calculate_experience_score(self, app, job, candidate) -> float:
        experiences = await db.experiences.find({"candidate_id": candidate["id"]}).to_list(100)
        
        if not experiences:
            return 50.0
        
        total_years = 0
        for exp in experiences:
            start = exp["start_date"]
            end = exp["end_date"] if exp["end_date"] else datetime.now()
            years = (end - start).days / 365.25
            total_years += years
        
        required_years = 2
        if job.get("employment_type") and "senior" in job["employment_type"].lower():
            required_years = 5
        elif job.get("employment_type") and "pleno" in job["employment_type"].lower():
            required_years = 3
        
        ratio = min(total_years / required_years, 1.0) if required_years > 0 else 1.0
        return ratio * 100
    
    async def _calculate_location_score(self, job, candidate) -> float:
        if job["work_mode"] == "remoto":
            return 100.0
        
        if candidate.get("location_city") == job.get("location_city"):
            return 100.0
        elif candidate.get("location_state") == job.get("location_state"):
            return 70.0
        else:
            return 40.0
    
    async def _calculate_behavioral_score(self, app, job) -> float:
        if not job.get("ideal_profile"):
            return 100.0
        
        assessments = await db.assessments.find({"application_id": app["id"]}).to_list(100)
        if not assessments:
            return 50.0
        
        return 75.0
    
    async def _calculate_availability_score(self, job, candidate) -> float:
        if not job.get("salary_min") or not candidate.get("salary_expectation"):
            return 100.0
        
        if candidate["salary_expectation"] <= job.get("salary_max", float('inf')):
            return 100.0
        else:
            return 50.0


from datetime import datetime
