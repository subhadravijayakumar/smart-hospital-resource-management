package com.hospital;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Smart Hospital Resource Optimization and Management System
 * Core Enterprise Application Entry Point
 */
@SpringBootApplication
@EnableScheduling
public class SmartHospitalApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartHospitalApplication.class, args);
        System.out.println("==================================================================");
        System.out.println(" Smart Hospital Resource Optimization Engine Started Successfully ");
        System.out.println(" Ready to accept REST API and ML Optimization workloads          ");
        System.out.println("==================================================================");
    }
}
